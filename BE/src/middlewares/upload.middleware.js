const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.resolve(process.cwd(), 'uploads', 'course-documents');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Danh sách MIME type được phép
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

// Danh sách extension được phép
const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);

// Danh sách extension nguy hiểm cần chặn tuyệt đối (phòng double-extension attack)
const dangerousExtensions = new Set([
  '.php',
  '.php3',
  '.php4',
  '.php5',
  '.php7',
  '.phtml',
  '.phar',
  '.asp',
  '.aspx',
  '.asa',
  '.asax',
  '.jsp',
  '.jspx',
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.ps1',
  '.py',
  '.rb',
  '.pl',
  '.cgi',
  '.htaccess',
  '.htpasswd',
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
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = crypto.randomUUID();

    // Lưu tên file vật lý bằng UUID + extension, không dựa vào originalname.
    // originalname vẫn có thể được lưu riêng trong metadata/database để hiển thị cho người dùng.
    cb(null, `${uniqueName}${ext}`);
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

function getUploadedFile(req) {
  return (
    req.file ||
    req.files?.file?.[0] ||
    req.files?.document?.[0] ||
    req.files?.documentFile?.[0] ||
    (Array.isArray(req.files) ? req.files[0] : null)
  );
}

function isValidDocumentSignature(buffer, extension) {
  if (extension === '.pdf') {
    return buffer.slice(0, 5).toString('ascii') === '%PDF-';
  }

  if (extension === '.doc') {
    const docSignature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    return buffer.slice(0, docSignature.length).equals(docSignature);
  }

  if (extension === '.docx') {
    if (!buffer.slice(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
      return false;
    }
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 65536));
    return text.includes('word/document.xml');
  }

  return false;
}

async function validateCourseDocumentContent(req, res, next) {
  const uploadedFile = getUploadedFile(req);
  if (!uploadedFile) {
    return res.status(400).json({ success: false, message: 'Document file is required' });
  }

  const extension = path.extname(uploadedFile.originalname || '').toLowerCase();
  if (!allowedExtensions.has(extension)) {
    return res.status(400).json({ success: false, message: 'Định dạng file không hợp lệ' });
  }

  try {
    const buffer = await fs.promises.readFile(uploadedFile.path);
    if (!isValidDocumentSignature(buffer, extension)) {
      await fs.promises.unlink(uploadedFile.path).catch(() => {});
      return res.status(400).json({ success: false, message: 'Định dạng file không hợp lệ' });
    }
    return next();
  } catch (error) {
    console.error('Error validating document content:', error);
    if (uploadedFile.path) {
      await fs.promises.unlink(uploadedFile.path).catch(() => {});
    }
    return res.status(400).json({ success: false, message: 'Định dạng file không hợp lệ' });
  }
}

module.exports = {
  uploadCourseDocument,
  validateCourseDocumentContent,
};
