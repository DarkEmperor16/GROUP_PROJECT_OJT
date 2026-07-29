FROM python:3.9-slim

# Thiết lập thư mục làm việc gốc cho container
WORKDIR /app/AI

# Cài đặt các thư viện hệ thống cần thiết (nếu có package C++ như faiss)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements vào trước để cache lại layer này
COPY requirements.txt .

# Cài đặt dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code của AI vào container
COPY . .

# Chuyển WORKDIR vào trong thư mục backend - Nơi chứa main.py và thư mục app
# Bước này vô cùng quan trọng để xử lý lỗi "ModuleNotFoundError: No module named 'app'"
WORKDIR /app/AI/backend

# Expose port 8000 cho FastAPI
EXPOSE 8000

# Chạy server uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
