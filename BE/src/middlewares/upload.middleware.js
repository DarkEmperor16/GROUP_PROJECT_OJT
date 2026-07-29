const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.resolve(process.cwd(), 'uploads', 'course-documents');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/octet-stream',
  'text/plain',
]);

const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    // SEC-F2.5: Sử dụng UUID để bảo mật tên file gốc
    const randomName = require('crypto').randomUUID();

    cb(null, `${randomName}${ext}`);
  },
});

const uploadCourseDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const isAllowedMimeType = allowedMimeTypes.has(file.mimetype);
    const isAllowedExtension = allowedExtensions.has(extension);

    if (!isAllowedMimeType && !isAllowedExtension) {
      return cb(new Error('Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT'));
    }

    return cb(null, true);
  },
});

module.exports = {
  uploadCourseDocument,
};
