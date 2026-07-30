from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Tải cấu hình từ file env của BE ở ngoài
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(base_dir, "BE", ".env")
load_dotenv(dotenv_path=env_path)

# Cấu hình thư mục cache cục bộ cho HuggingFace để tránh tải lại model mỗi lần chạy
hf_cache_dir = os.path.join(base_dir, "AI", "backend", "data", "model_cache")
os.makedirs(hf_cache_dir, exist_ok=True)
os.environ["HF_HOME"] = hf_cache_dir
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from app.api import chat_router, quiz_router, documents_router

app = FastAPI(title="Aviation RAG API")

# Cấu hình CORS cho phép giao diện Frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả các nguồn (dùng cho test)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(quiz_router, prefix="/api/v1/quiz", tags=["Quiz"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["Documents"])

from pydantic import BaseModel
from typing import Optional

class BEAskRequest(BaseModel):
    question: str
    courseCode: str
    courseTitle: Optional[str] = ""

@app.get("/")
async def root():
    return {"message": "Aviation RAG Backend is running"}

@app.post("/")
async def root_ask(request: BEAskRequest):
    """
    Endpoint này được tạo ra để tương thích trực tiếp với payload từ Node.js BE.
    Nó nhận JSON 1 lần và trả về kết quả 1 lần (không stream).
    """
    from app.api.chat import vector_service, chat_service, _normalize_subject, semantic_cache
    from app.core.security import sanitize_input, is_prompt_injection
    
    clean_message = sanitize_input(request.question)
    subject = _normalize_subject(request.courseCode)
    
    if not clean_message:
        return {"answer": "Message is required."}
        
    if is_prompt_injection(clean_message):
        return {"answer": "Hệ thống phát hiện nội dung không an toàn và từ chối xử lý."}
        
    cache_key = f"subject={subject}|question={clean_message}"
    cached_answer = semantic_cache.check_cache(cache_key)
    if cached_answer:
        return {"answer": cached_answer}
        
    docs = vector_service.search(clean_message, subject=subject, k=4)
    
    max_context_length = 3000
    compressed_docs = []
    current_len = 0
    for doc in docs:
        if current_len + len(doc.page_content) > max_context_length:
            remaining_space = max_context_length - current_len
            if remaining_space > 200:
                doc.page_content = doc.page_content[:remaining_space] + "... [trimmed]"
                compressed_docs.append(doc)
            break
        compressed_docs.append(doc)
        current_len += len(doc.page_content)
        
    full_answer = ""
    try:
        for chunk in chat_service.stream_answer(clean_message, compressed_docs, subject):
            full_answer += chunk
            
        if full_answer and not full_answer.startswith("Loi sinh cau tra loi:") and not full_answer.startswith("Error:"):
            semantic_cache.add_to_cache(cache_key, full_answer)
            
        return {"answer": full_answer}
    except Exception as exc:
        return {"answer": f"Lỗi sinh câu trả lời: {str(exc)}"}
