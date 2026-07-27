from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.quiz_service import QuizService
import os
import json
from datetime import datetime

router = APIRouter()

class QuizRequest(BaseModel):
    subject: str
    num_questions: int = 5
    level: Optional[str] = "Trung bình"


quiz_service = QuizService()

# Tận dụng vector_service đã khởi tạo bên chat api
from app.api.chat import vector_service

# Đường dẫn lưu trữ Quiz
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
QUIZ_STORAGE_DIR = os.path.join(base_dir, "data", "quizzes")

@router.post("/generate")
async def generate_quiz(request: QuizRequest):
    """
    Endpoint sinh câu hỏi ôn tập (AI-F6).
    """
    # 1. Lấy tài liệu liên quan đến môn học để sinh câu hỏi
    docs = vector_service.search(request.subject, subject=request.subject, k=10)
    
    if not docs:
        # Thay vì 404, trả về lỗi với thông báo rõ ràng để FE hiển thị
        raise HTTPException(
            status_code=400, 
            detail=f"Không tìm thấy tài liệu cho môn học '{request.subject}'. Vui lòng kiểm tra lại tên môn học hoặc upload tài liệu trước khi sinh quiz."
        )
    
    # 2. Sinh câu hỏi bằng LLM
    try:
        quiz_data = quiz_service.generate_quiz(request.subject, docs, request.num_questions)
        # Đảm bảo quiz_data là chuỗi JSON hợp lệ
        return {"quiz": quiz_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi sinh quiz: {str(e)}")


