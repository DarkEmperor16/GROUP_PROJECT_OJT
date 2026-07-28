const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const CourseDocument = require('../models/CourseDocument');
const QaHistory = require('../models/QaHistory');
const { activityLogs } = require('../data/activityLogs');

function buildUserResponse(user) {
  return {
    id: user._id?.toString?.() || user.id,
    fullName: user.fullName,
    email: user.email,
    userCode: user.userCode || user.email?.split('@')[0]?.toUpperCase() || '',
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildDocumentResponse(document) {
  const course = document.courseId;
  const uploadedBy = document.uploadedBy;

  const fileType = document.mimeType?.split('/')[1] || 'txt';

  return {
    id: document._id?.toString?.() || document.id,
    fileName: document.fileName || document.title,
    courseId: course?._id?.toString?.() || course?.id || document.courseId?.toString?.() || '',
    courseCode: course?.courseCode || '',
    courseName: course?.title || course?.name || '',
    version: document.version,
    description: document.description,
    uploadedBy: uploadedBy?.email || uploadedBy?.fullName || document.uploadedBy?.toString?.() || '',
    uploadedAt: document.createdAt,
    isActive: document.status === 'active',
    fileType,
    fileSize: document.size || 0,
  };
}

function buildQaLogResponse(record) {
  const student = record.studentId;
  const course = record.courseId;

  return {
    id: record._id?.toString?.() || record.id,
    userId: student?._id?.toString?.() || student?.id || '',
    userName: student?.fullName || 'Unknown user',
    userEmail: student?.email || '',
    userRole: student?.role || 'STUDENT',
    courseId: course?._id?.toString?.() || course?.id || '',
    courseCode: course?.courseCode || '',
    courseName: course?.title || course?.name || '',
    question: record.question,
    answer: record.answer,
    status: 'SUCCESS',
    timestamp: record.createdAt,
    latencyMs: 0,
    tokensUsed: 0,
    errorMessage: '',
  };
}

function buildSystemLogResponse(log) {
  const level = log.result === 'FAILED' ? 'ERROR' : log.result === 'WARNING' ? 'WARNING' : 'INFO';

  return {
    id: log.id,
    user: log.userId ? `user-${log.userId}` : 'system',
    action: log.action,
    timestamp: log.timestamp,
    level,
    details: `${log.action} (${log.result})`,
  };
}

function parsePagination(req) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

async function listUsers(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search?.trim() || '';
    const role = req.query.role?.trim() || '';
    const status = req.query.status?.trim() || '';

    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) filter.role = role;
    if (status) filter.status = status;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      data: users.map(buildUserResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load users' });
  }
}

async function createUser(req, res) {
  try {
    const { fullName, email, userCode, password, role, status } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const createdUser = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      userCode: String(userCode || normalizedEmail.split('@')[0] || '').trim().toUpperCase(),
      passwordHash: await bcrypt.hash(String(password), 10),
      role: role || 'STUDENT',
      status: status || 'ACTIVE',
    });

    return res.status(201).json({
      data: buildUserResponse(createdUser),
      user: buildUserResponse(createdUser),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { fullName, email, userCode, role, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && String(email).trim()) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });

      if (duplicate) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      user.email = normalizedEmail;
    }

    if (fullName) user.fullName = String(fullName).trim();
    if (userCode !== undefined) user.userCode = String(userCode).trim().toUpperCase();
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    return res.json({
      data: buildUserResponse(user),
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update user' });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status || (user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    await user.save();

    return res.json({
      data: buildUserResponse(user),
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update user status' });
  }
}

async function listDocuments(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search?.trim() || '';
    const courseId = req.query.courseId?.trim() || '';
    const fileType = req.query.fileType?.trim() || '';
    const version = req.query.version?.trim() || '';
    const uploadedBy = req.query.uploadedBy?.trim() || '';

    const filter = {};

    if (search) {
      filter.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (courseId) filter.courseId = courseId;
    if (version) filter.version = version;
    if (fileType) {
      filter.mimeType = { $regex: fileType, $options: 'i' };
    }

    if (uploadedBy) {
      const uploadedByUser = await User.findOne({ email: { $regex: uploadedBy, $options: 'i' } }).select('_id');
      if (uploadedByUser) {
        filter.uploadedBy = uploadedByUser._id;
      } else {
        filter.uploadedBy = null;
      }
    }

    const [documents, total] = await Promise.all([
      CourseDocument.find(filter)
        .populate('courseId', 'courseCode title name')
        .populate('uploadedBy', 'email fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CourseDocument.countDocuments(filter),
    ]);

    return res.json({
      data: documents.map(buildDocumentResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load documents' });
  }
}

async function createDocument(req, res) {
  try {
    const payload = req.body || {};
    const { courseId, version, description, fileName, fileType, fileSize } = payload;

    if (!courseId || !fileName || !version) {
      return res.status(400).json({ message: 'courseId, fileName and version are required' });
    }

    const document = await CourseDocument.create({
      courseId,
      uploadedBy: req.user._id,
      title: fileName,
      version: String(version).trim(),
      description: description || '',
      fileName: String(fileName).trim(),
      storagePath: `uploads/course-documents/${String(fileName).trim()}`,
      mimeType: fileType ? `${fileType}/unknown` : 'application/octet-stream',
      size: Number(fileSize) || 0,
      status: 'active',
    });

    const populated = await CourseDocument.findById(document._id).populate('courseId', 'courseCode title name').populate('uploadedBy', 'email fullName');

    return res.status(201).json({
      data: buildDocumentResponse(populated),
      document: buildDocumentResponse(populated),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create document' });
  }
}

async function updateDocumentStatus(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid document id' });
    }

    const document = await CourseDocument.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = document.status === 'active' ? 'inactive' : 'active';
    await document.save();

    const populated = await CourseDocument.findById(document._id).populate('courseId', 'courseCode title name').populate('uploadedBy', 'email fullName');

    return res.json({
      data: buildDocumentResponse(populated),
      document: buildDocumentResponse(populated),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update document status' });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid document id' });
    }

    const document = await CourseDocument.findByIdAndDelete(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete document' });
  }
}

async function listQaLogs(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search?.trim() || '';
    const role = req.query.role?.trim() || '';
    const courseId = req.query.courseId?.trim() || '';
    const status = req.query.status?.trim() || '';
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

    const filter = {};

    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    if (courseId) filter.courseId = courseId;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const records = await QaHistory.find(filter)
      .populate('studentId', 'fullName email role')
      .populate('courseId', 'courseCode title name')
      .sort({ createdAt: -1 });

    let filtered = records.map(buildQaLogResponse);

    if (role) {
      filtered = filtered.filter((item) => item.userRole === role);
    }

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    return res.json({
      data: paged,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load QA logs' });
  }
}

async function exportQaLogs(req, res) {
  try {
    const search = req.query.search?.trim() || '';
    const role = req.query.role?.trim() || '';
    const courseId = req.query.courseId?.trim() || '';
    const status = req.query.status?.trim() || '';
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

    const filter = {};

    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    if (courseId) filter.courseId = courseId;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const records = await QaHistory.find(filter)
      .populate('studentId', 'fullName email role')
      .populate('courseId', 'courseCode title name')
      .sort({ createdAt: -1 });

    let filtered = records.map(buildQaLogResponse);

    if (role) filtered = filtered.filter((item) => item.userRole === role);
    if (status) filtered = filtered.filter((item) => item.status === status);

    return res.json({ data: filtered });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to export QA logs' });
  }
}

function listDashboardLogs(req, res) {
  return res.json({
    data: activityLogs.slice(-50).reverse().map(buildSystemLogResponse),
  });
}

function listAuditLogs(req, res) {
  return res.json({
    items: activityLogs.slice(-50).reverse().map(buildSystemLogResponse),
    total: activityLogs.length,
    page: 1,
    limit: 50,
  });
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  updateUserStatus,
  listDocuments,
  createDocument,
  updateDocumentStatus,
  deleteDocument,
  listQaLogs,
  exportQaLogs,
  listDashboardLogs,
  listAuditLogs,
};
