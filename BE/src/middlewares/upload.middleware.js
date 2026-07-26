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
  'text/plain',
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();

    cb(null, `${baseName}-${timestamp}${ext}`);
  },
});

const uploadCourseDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Unsupported file type. Allowed: PDF, DOCX, PPTX, TXT'));
    }

    return cb(null, true);
  },
});

module.exports = {
  uploadCourseDocument,
};
