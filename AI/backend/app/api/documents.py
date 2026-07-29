import json
import os
import shutil
import uuid
import urllib.request
import urllib.error
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.document_service import DocumentService
from app.api.chat import vector_service
from app.api.chat import semantic_cache # Import semantic_cache để clear

router = APIRouter()
doc_service = DocumentService()

# Đường dẫn đến file metadata
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
METADATA_FILE = os.path.join(base_dir, "data", "document_metadata.json")

def _normalize_subject(subject_name: str) -> str:
    """Chuẩn hóa tên môn học về dạng chữ thường và bỏ khoảng trắng thừa."""
    return subject_name.strip().lower()

def _load_metadata() -> Dict[str, Any]:
    """Tải metadata từ file JSON."""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"documents": []}

def _save_metadata(metadata: Dict[str, Any]):
    """Lưu metadata vào file JSON."""
    os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

def _process_single_file_background(file_location: str, filename: str, normalized_subject: str):
    try:
        # 1. Trích xuất text (AI-F1.1)
        extracted_data = doc_service.extract_text(file_location)

        # 2. Chia nhỏ tài liệu (AI-F2)
        chunks = doc_service.chunk_text(extracted_data, common_metadata={
            "source": filename, 
            "subject": normalized_subject
        })

        # 3. Thêm vào Vector DB (AI-F3)
        vector_service.add_documents(chunks)

        # 4. Lưu index để sử dụng sau này
        vector_service.save_local(os.path.join(base_dir, "data", "vector_db"))

        # 5. Cập nhật metadata
        metadata_store = _load_metadata()
        if not any(d["filename"] == filename and d["subject"] == normalized_subject for d in metadata_store["documents"]):
            metadata_store["documents"].append({"filename": filename, "subject": normalized_subject})
        _save_metadata(metadata_store)
    except Exception as e:
        print(f"[Error processing {filename}]: {e}")

def _notify_be_status(document_id: str, status: str, error_message: str = None):
    """Gọi webhook báo cáo trạng thái xử lý về cho Backend Node.js."""
    if not document_id:
        return
    try:
        url = f"http://localhost:3000/api/internal/ai/documents/{document_id}/status"
        payload = {"status": status}
        if error_message:
            payload["errorMessage"] = error_message
            
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req) as response:
            print(f"[Webhook] Notified BE for {document_id}, status: {status}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[Webhook Error] Failed to notify BE for {document_id}: HTTP {e.code} - {error_body}")
    except Exception as e:
        print(f"[Webhook Error] Failed to notify BE for {document_id}: {e}")

def _index_wrapper_background(source_path: str, dest_path: str, filename: str, normalized_subject: str, document_id: str = None):
    """Wrapper chạy ngầm để copy file và xử lý RAG mà không block request."""
    try:
        # Copy file
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(source_path, dest_path)
        
        # Cập nhật metadata ngay khi copy xong để hiện lên UI
        metadata_store = _load_metadata()
        if not any(d["filename"] == filename and d["subject"] == normalized_subject for d in metadata_store["documents"]):
            metadata_store["documents"].append({"filename": filename, "subject": normalized_subject})
        _save_metadata(metadata_store)
        
        # Gọi tiến trình RAG nặng
        _process_single_file_background(dest_path, filename, normalized_subject)
        
        # Báo cáo thành công về BE
        if document_id:
            _notify_be_status(document_id, "active")
    except Exception as e:
        print(f"[Background Index Error for {filename}]: {e}")
        # Báo cáo thất bại về BE
        if document_id:
            _notify_be_status(document_id, "failed", str(e))

def _verify_magic_bytes(upload_file: UploadFile, ext: str) -> bool:
    """Kiểm tra Magic Bytes của file để chống Extension Spoofing (SEC-F2.6)."""
    if ext == '.txt':
        return True
        
    magic = upload_file.file.read(4)
    upload_file.file.seek(0)
    hex_magic = magic.hex().upper()
    
    if ext == '.pdf' and hex_magic == '25504446':
        return True
    if ext in ['.docx', '.pptx'] and hex_magic == '504B0304':
        return True
    if ext in ['.doc', '.ppt'] and hex_magic == 'D0CF11E0':
        return True
        
    return False

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    subject: str = Form(...)
):
    """
    Endpoint tải lên và xử lý 1 tài liệu trong nền (Background Task).
    """
    try:
        import uuid
        ext = os.path.splitext(file.filename)[1].lower()
        
        # SEC-F2.6: Kiểm tra Magic Bytes ở đầu AI
        if not _verify_magic_bytes(file, ext):
            raise HTTPException(status_code=400, detail="Lỗi bảo mật: Định dạng file bị giả mạo (Magic Bytes mismatch).")
            
        normalized_subject = _normalize_subject(subject)
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        file_location = os.path.join(base_dir, "data", "docs", safe_filename)
        os.makedirs(os.path.dirname(file_location), exist_ok=True)

        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        # Cập nhật metadata ngay lập tức để frontend thấy
        metadata_store = _load_metadata()
        if not any(d["filename"] == file.filename and d["subject"] == normalized_subject for d in metadata_store["documents"]):
            metadata_store["documents"].append({"filename": file.filename, "subject": normalized_subject})
        _save_metadata(metadata_store)

        background_tasks.add_task(_process_single_file_background, file_location, file.filename, normalized_subject)

        return {
            "message": f"Đang xử lý tài liệu '{file.filename}' trong nền. Vui lòng chờ vài phút.",
            "subject": normalized_subject
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu tài liệu '{file.filename}': {str(e)}")

@router.post("/upload-batch")
async def upload_documents_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    subject: str = Form(...)
):
    """
    Endpoint tải lên và xử lý hàng loạt tài liệu trong nền.
    """
    normalized_subject = _normalize_subject(subject)
    results = []
    for file in files:
        try:
            file_location = os.path.join(base_dir, "data", "docs", file.filename)
            os.makedirs(os.path.dirname(file_location), exist_ok=True)

            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(file.file, file_object)
            
            # Cập nhật metadata ngay lập tức
            metadata_store = _load_metadata()
            if not any(d["filename"] == file.filename and d["subject"] == normalized_subject for d in metadata_store["documents"]):
                metadata_store["documents"].append({"filename": file.filename, "subject": normalized_subject})
            _save_metadata(metadata_store)

            background_tasks.add_task(_process_single_file_background, file_location, file.filename, normalized_subject)
            results.append({"file": file.filename, "status": "processing"})
        except Exception as e:
            results.append({"file": file.filename, "status": "error", "message": str(e)})
    
    # Cập nhật metadata sau khi xử lý batch
    metadata_store = _load_metadata()
    for res in results:
        if res["status"] == "success":
            if not any(d["filename"] == res["file"] and d["subject"] == normalized_subject for d in metadata_store["documents"]):
                metadata_store["documents"].append({"filename": res["file"], "subject": normalized_subject})
    _save_metadata(metadata_store)

    return {
        "message": f"Đã hoàn thành xử lý {len(files)} tài liệu",
        "details": results
    }

class FolderIngestRequest(BaseModel):
    folder_path: str
    subject: str

def _process_folder_background(folder_path: str, normalized_subject: str, valid_extensions: tuple):
    files_to_process = [
        f for f in os.listdir(folder_path) 
        if f.lower().endswith(valid_extensions)
    ]

    results = []
    for filename in files_to_process:
        file_path = os.path.join(folder_path, filename)
        try:
            # Sao chép vào thư mục docs của backend để quản lý
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            dest_path = os.path.join(base_dir, "data", "docs", filename)
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(file_path, dest_path)
            
            # Xử lý RAG
            extracted_data = doc_service.extract_text(dest_path)
            chunks = doc_service.chunk_text(extracted_data, common_metadata={"source": filename, "subject": normalized_subject})
            vector_service.add_documents(chunks)
            
            results.append({"file": filename, "status": "success", "chunks": len(chunks)})
        except Exception as e:
            results.append({"file": filename, "status": "error", "message": str(e)})

    # Lưu vector db sau khi xử lý xong toàn bộ
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    vector_service.save_local(os.path.join(base_dir, "data", "vector_db"))

    # Cập nhật metadata
    metadata_store = _load_metadata()
    for res in results:
        if res["status"] == "success":
            if not any(d["filename"] == res["file"] and d["subject"] == normalized_subject for d in metadata_store["documents"]):
                metadata_store["documents"].append({"filename": res["file"], "subject": normalized_subject})
    _save_metadata(metadata_store)

@router.post("/ingest-folder")
async def ingest_folder_from_path(request: FolderIngestRequest, background_tasks: BackgroundTasks):
    """
    Endpoint nạp toàn bộ tài liệu từ một đường dẫn thư mục local trên server (chạy ngầm).
    """
    normalized_subject = _normalize_subject(request.subject) # Chuẩn hóa subject từ request
    
    if not os.path.exists(request.folder_path):
        raise HTTPException(status_code=404, detail=f"Thư mục không tồn tại: {request.folder_path}")

    valid_extensions = ('.pdf', '.docx', '.pptx')
    files_to_process = [
        f for f in os.listdir(request.folder_path) 
        if f.lower().endswith(valid_extensions)
    ]

    if not files_to_process:
        return {"message": "Không tìm thấy file hợp lệ trong thư mục", "processed": 0}

    background_tasks.add_task(_process_folder_background, request.folder_path, normalized_subject, valid_extensions)

    return {
        "message": f"Đã tiếp nhận yêu cầu quét thư mục {request.folder_path}. Hệ thống đang xử lý ngầm (hãy kiểm tra lại sau ít phút).",
        "processed_count": len(files_to_process),
        "details": []
    }

@router.post("/index")
def index_document(request: dict, background_tasks: BackgroundTasks):
    """
    Endpoint nhận yêu cầu index từ BE Node.js.
    """
    try:
        storage_path = request.get("storagePath")
        if not storage_path:
            raise HTTPException(status_code=400, detail="Missing storagePath in payload")
            
        file_name = request.get("fileName", "unknown_file")
        course_code = request.get("courseCode", "unknown_course")
        document_id = request.get("documentId")

        project_root = os.path.dirname(os.path.dirname(base_dir))
        
        # Resolve file path từ storagePath của BE
        file_path = os.path.join(project_root, "BE", storage_path)
        
        # Nếu BE truyền đường dẫn tuyệt đối hoặc không có folder BE
        if not os.path.exists(file_path):
            file_path_fallback = os.path.join(project_root, storage_path)
            if os.path.exists(file_path_fallback):
                file_path = file_path_fallback
            else:
                raise HTTPException(status_code=404, detail=f"Không tìm thấy file từ storagePath: {storage_path}")

        normalized_subject = _normalize_subject(course_code)
        
        import uuid
        ext = os.path.splitext(file_name)[1]
        safe_filename = f"{document_id}{ext}" if document_id else f"{uuid.uuid4().hex}{ext}"
        
        # Sửa lại đường dẫn đích chính xác hơn, lưu bằng safe_filename
        dest_path = os.path.join(base_dir, "data", "docs", safe_filename)

        # Đẩy toàn bộ quá trình copy file và chạy RAG vào Background để trả về kết quả ngay lập tức
        background_tasks.add_task(_index_wrapper_background, file_path, dest_path, file_name, normalized_subject, document_id)

        return {
            "accepted": True,
            "requestId": f"ai-{uuid.uuid4()}",
            "status": "processing"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/status")
async def update_status(payload: dict):
    """
    Endpoint nhận cập nhật trạng thái từ BE (tránh lỗi 404).
    """
    return {
        "accepted": True,
        "status": payload.get("status", "received")
    }

@router.get("/")
async def list_documents():
    """
    Liệt kê danh sách tài liệu đã upload (AI-F1.3).
    """
    metadata_store = _load_metadata()
    # Kiểm tra xem file vật lý có còn tồn tại không
    # base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # docs_dir = os.path.join(base_dir, "data", "docs")
    # if os.path.exists(docs_dir):
    #     existing_files = set(os.listdir(docs_dir))
    #     metadata_store["documents"] = [
    #         doc for doc in metadata_store["documents"] if doc["filename"] in existing_files
    #     ]
    #     _save_metadata(metadata_store) # Lưu lại nếu có thay đổi (file bị xóa thủ công)

    return {
        "total_count": len(metadata_store["documents"]),
        "documents": metadata_store["documents"]
    }

@router.post("/clear-semantic-cache")
async def clear_semantic_cache_api():
    """
    Xóa toàn bộ Semantic Cache đã lưu.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cache_dir = os.path.join(base_dir, "data", "semantic_cache")
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
    # Re-initialize the cache service to ensure it starts clean
    from app.api.chat import semantic_cache
    semantic_cache.cache_store = None
    semantic_cache.load_cache() # Reloads (which will be empty now)
    return {"message": "Đã xóa toàn bộ Semantic Cache."}

@router.post("/clear-all-data")
async def clear_all_data_api():
    """
    Xóa toàn bộ tài liệu đã upload, Vector DB, Semantic Cache, Metadata và Lịch sử Chat.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # 1. Xóa file metadata
    if os.path.exists(METADATA_FILE):
        os.remove(METADATA_FILE)
        
    # 2. Xóa các thư mục dữ liệu
    docs_dir = os.path.join(base_dir, "data", "docs")
    if os.path.exists(docs_dir):
        shutil.rmtree(docs_dir)
        os.makedirs(docs_dir)
        
    vector_db_dir = os.path.join(base_dir, "data", "vector_db")
    if os.path.exists(vector_db_dir):
        shutil.rmtree(vector_db_dir)
        os.makedirs(vector_db_dir)
    
    cache_dir = os.path.join(base_dir, "data", "semantic_cache")
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
        os.makedirs(cache_dir)
        
    chat_history_db = os.path.join(base_dir, "data", "chat_history.db")
    if os.path.exists(chat_history_db):
        os.remove(chat_history_db)

    # 3. Re-initialize services một cách an toàn
    from app.api.chat import vector_service, semantic_cache
    try:
        vector_service.vector_store = None
        vector_service.load_local(vector_db_dir)
    except Exception:
        pass # Chấp nhận vì db đang trống
        
    try:
        semantic_cache.cache_store = None
        semantic_cache.load_cache()
    except Exception:
        pass
        
    try:
        from app.api.chat_history import chat_history_service
        chat_history_service._init_db()
    except Exception:
        pass

    return {"message": "Đã xóa sạch toàn bộ tài liệu, metadata, Vector DB, Semantic Cache và Lịch sử Chat."}

@router.delete("/{subject}")
async def delete_subject_documents(subject: str):
    """
    Xóa tất cả tài liệu và vector thuộc một môn học cụ thể (AI-F3.5).
    """
    normalized_subject = _normalize_subject(subject)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    docs_dir = os.path.join(base_dir, "data", "docs")

    # 1. Tải và cập nhật metadata
    metadata_store = _load_metadata()

    # Lọc ra những tài liệu KHÔNG thuộc môn học bị xóa
    updated_docs = [d for d in metadata_store["documents"] if d["subject"] != normalized_subject]
    deleted_docs = [d for d in metadata_store["documents"] if d["subject"] == normalized_subject]

    if not deleted_docs:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy tài liệu nào thuộc môn học: {subject}")

    # 2. Xóa file vật lý
    for doc in deleted_docs:
        file_path = os.path.join(docs_dir, doc["filename"])
        if os.path.exists(file_path):
            os.remove(file_path)

    # 3. Lưu metadata mới
    metadata_store["documents"] = updated_docs
    _save_metadata(metadata_store)

    # 4. Tái tạo lại Vector Index (Re-index)
    # FAISS không hỗ trợ xóa theo filter hiệu quả, nên cách tốt nhất là rebuild từ các file còn lại
    from app.api.chat import vector_service
    vector_service.clear() # Xóa index hiện tại trong memory

    # Quét lại toàn bộ file còn lại trong docs_dir và nạp lại
    if os.path.exists(docs_dir):
        all_files = os.listdir(docs_dir)
        for filename in all_files:
            # Tìm subject của file này trong metadata mới
            doc_info = next((d for d in updated_docs if d["filename"] == filename), None)
            if doc_info:
                file_path = os.path.join(docs_dir, filename)
                extracted_data = doc_service.extract_text(file_path)
                chunks = doc_service.chunk_text(extracted_data, common_metadata={
                    "source": filename, 
                    "subject": doc_info["subject"]
                })
                vector_service.add_documents(chunks)

    # Lưu lại index mới xuống đĩa
    vector_service.save_local(os.path.join(base_dir, "data", "vector_db"))

    return {
        "message": f"Đã xóa thành công {len(deleted_docs)} tài liệu thuộc môn học '{subject}' và cập nhật lại Vector Index.",
        "deleted_count": len(deleted_docs)
    }