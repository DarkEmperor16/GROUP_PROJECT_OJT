const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.resolve(process.cwd(), 'uploads', 'course-documents');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Danh sách MIME type được phép
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'text/plain',
  // Lưu ý: 'application/octet-stream' bị loại bỏ vì quá chung chung
  // và có thể bị lợi dụng để bypass validation
]);

// Danh sách extension được phép
const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']);

// Danh sách extension nguy hiểm cần chặn tuyệt đối (phòng double-extension attack)
const dangerousExtensions = new Set([
  '.php', '.php3', '.php4', '.php5', '.php7', '.phtml', '.phar',
  '.asp', '.aspx', '.asa', '.asax',
  '.jsp', '.jspx',
  '.exe', '.sh', '.bat', '.cmd', '.ps1',
  '.py', '.rb', '.pl', '.cgi',
  '.htaccess', '.htpasswd',
]);

/**
 * Kiểm tra double-extension attack: ví dụ "shell.jpg.php"
 * Tách tên file thành các phần và kiểm tra từng phần có chứa extension nguy hiểm không.
 */
function hasDangerousExtension(originalName) {
  const parts = originalName.toLowerCase().split('.');
  // Bỏ qua phần đầu (tên file), kiểm tra tất cả các extension còn lại
  for (let i = 1; i < parts.length; i++) {
    if (dangerousExtensions.has(`.${parts[i]}`)) {
      return true;
    }
  }
  return false;
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // Chỉ lấy extension cuối cùng đã được whitelist để đặt tên file lưu trên disk
    const ext = path.extname(file.originalname).toLowerCase();
    // Làm sạch tên file: xóa toàn bộ phần extension (kể cả double ext), chỉ giữ baseName
    const rawBase = file.originalname.replace(/\.[^.]+$/, ''); // bỏ ext cuối
    const safeBase = rawBase
      .replace(/\.[^.]+$/, '')  // bỏ thêm một lớp nữa để tránh "name.jpg.php" → "name.jpg"
      .replace(/[^a-zA-Z0-9\-_]/g, '-') // ký tự đặc biệt → dấu gạch ngang
      .replace(/-+/g, '-')
      .toLowerCase()
      .substring(0, 100); // giới hạn độ dài
    const timestamp = Date.now();

    cb(null, `${safeBase}-${timestamp}${ext}`);
  },
});

const uploadCourseDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const originalName = file.originalname || '';
    const extension = path.extname(originalName).toLowerCase();

    // 1. Chặn tuyệt đối nếu bất kỳ phần nào của tên file là extension nguy hiểm
    //    (ngăn double-extension attack: shell.jpg.php, shell.php.pdf, v.v.)
    if (hasDangerousExtension(originalName)) {
      return cb(new Error('Định dạng file không hợp lệ'));
    }

    // 2. Extension cuối phải nằm trong danh sách trắng
    const isAllowedExtension = allowedExtensions.has(extension);

    // 3. MIME type phải nằm trong danh sách trắng
    const isAllowedMimeType = allowedMimeTypes.has(file.mimetype);

    // 4. BẮT BUỘC cả hai điều kiện đều phải đúng (AND, không phải OR)
    //    Trước đây dùng OR nên kẻ tấn công có thể bypass qua MIME type
    if (!isAllowedExtension || !isAllowedMimeType) {
      return cb(new Error('Định dạng file không hợp lệ'));
    }

    return cb(null, true);
  },
});

module.exports = {
  uploadCourseDocument,
};
