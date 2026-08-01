const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
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
    isLocked: user.isLocked || false,
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
    uploadedBy:
      uploadedBy?.email || uploadedBy?.fullName || document.uploadedBy?.toString?.() || '',
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
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only System Admin can create accounts' });
    }

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
      userCode: String(userCode || normalizedEmail.split('@')[0] || '')
        .trim()
        .toUpperCase(),
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
      const uploadedByUser = await User.findOne({
        email: { $regex: uploadedBy, $options: 'i' },
      }).select('_id');
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

    const populated = await CourseDocument.findById(document._id)
      .populate('courseId', 'courseCode title name')
      .populate('uploadedBy', 'email fullName');

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

    const populated = await CourseDocument.findById(document._id)
      .populate('courseId', 'courseCode title name')
      .populate('uploadedBy', 'email fullName');

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
function buildCourseResponse(course) {
  const courseName = course.courseName || course.name || course.title || '';
  const courseCode = course.courseCode || course.code || '';
  const teacherIds = Array.isArray(course.teacherIds)
    ? course.teacherIds
    : course.teacherId
      ? [course.teacherId]
      : [];
  const teacherId = course.teacherId || teacherIds[0] || '';

  return {
    id: course._id?.toString?.() || course.id,
    courseCode,
    courseName,
    name: courseName,
    title: courseName,
    code: courseCode,
    description: course.description || '',
    status: course.status || 'ACTIVE',
    teacherId: teacherId ? teacherId.toString() : '',
    teacherIds: teacherIds.map((item) => (item ? item.toString() : item)),
    teacherName: course.teacherName || (teacherIds.length ? 'Assigned teacher' : 'Unassigned'),
    enrollmentCount: course.enrollmentCount ?? 0,
    documentCount: course.documentCount ?? 0,
    quizCount: course.quizCount ?? 0,
    chatHistoryCount: course.chatHistoryCount ?? 0,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

async function listCourses(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req);

    const search = req.query.search?.trim() || '';
    const status = req.query.status?.trim() || '';

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Course.countDocuments(filter),
    ]);

    const Enrollment = require('../models/Enrollment');
    const Quiz = require('../models/Quiz');
    const QaRecord = require('../models/QaRecord');
    const data = await Promise.all(
      courses.map(async (course) => {
        const [enrollmentCount, documentCount, quizCount, qaHistoryCount, qaRecordCount] =
          await Promise.all([
            Enrollment.countDocuments({
              courseId: course._id,
              status: 'ACTIVE',
            }),
            CourseDocument.countDocuments({
              courseId: course._id,
            }),
            Quiz.countDocuments({
              courseId: course._id,
            }),
            QaHistory.countDocuments({
              courseId: course._id,
            }),
            QaRecord.countDocuments({
              courseId: course._id,
            }),
          ]);
        const mapped = buildCourseResponse(course);
        mapped.enrollmentCount = enrollmentCount;
        mapped.documentCount = documentCount;
        mapped.quizCount = quizCount;
        mapped.chatHistoryCount = qaHistoryCount + qaRecordCount;
        return mapped;
      }),
    );

    return res.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Failed to load courses',
    });
  }
}
async function createCourse(req, res) {
  try {
    const courseName = req.body.courseName || req.body.name || req.body.title || '';
    const courseCode = req.body.courseCode || req.body.code || '';
    const description = req.body.description || '';
    const teacherId =
      req.body.teacherId ||
      (Array.isArray(req.body.teacherIds) ? req.body.teacherIds[0] : req.body.teacherIds);
    const teacherIds = Array.isArray(req.body.teacherIds)
      ? req.body.teacherIds
      : teacherId
        ? [teacherId]
        : [];
    const status = req.body.status || 'ACTIVE';

    if (!courseName.trim()) {
      return res.status(400).json({
        message: 'Course name is required',
      });
    }

    if (!courseCode.trim()) {
      return res.status(400).json({
        message: 'Course code is required',
      });
    }

    const normalizedCode = courseCode.trim().toUpperCase();
    const existed = await Course.findOne({
      code: normalizedCode,
    });

    if (existed) {
      return res.status(409).json({
        message: 'Course code already exists',
      });
    }

    const course = await Course.create({
      name: courseName.trim(),
      title: courseName.trim(),
      code: normalizedCode,
      description,
      teacherId: teacherId || undefined,
      teacherIds,
      status,
    });

    return res.status(201).json({
      data: buildCourseResponse(course),
      course: buildCourseResponse(course),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Create Failed',
    });
  }
}
async function updateCourse(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid course id',
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
      });
    }

    const updatePayload = {};

    if (
      req.body.courseName !== undefined ||
      req.body.name !== undefined ||
      req.body.title !== undefined
    ) {
      const courseName = req.body.courseName || req.body.name || req.body.title || '';
      updatePayload.name = courseName.trim();
      updatePayload.title = courseName.trim();
    }

    if (req.body.courseCode !== undefined || req.body.code !== undefined) {
      updatePayload.code = (req.body.courseCode || req.body.code || '').trim().toUpperCase();
    }

    if (req.body.description !== undefined) {
      updatePayload.description = req.body.description;
    }

    if (req.body.teacherId !== undefined || req.body.teacherIds !== undefined) {
      const teacherId =
        req.body.teacherId ||
        (Array.isArray(req.body.teacherIds) ? req.body.teacherIds[0] : req.body.teacherIds);
      const teacherIds = Array.isArray(req.body.teacherIds)
        ? req.body.teacherIds
        : teacherId
          ? [teacherId]
          : [];
      updatePayload.teacherId = teacherId || undefined;
      updatePayload.teacherIds = teacherIds;
    }

    if (req.body.status !== undefined) {
      updatePayload.status = req.body.status;
    }

    Object.assign(course, updatePayload);

    await course.save();

    return res.json({
      data: buildCourseResponse(course),
      course: buildCourseResponse(course),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Failed to update course',
    });
  }
}
async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid course id',
      });
    }

    const Enrollment = require('../models/Enrollment');
    const Quiz = require('../models/Quiz');
    const QaRecord = require('../models/QaRecord');

    // BR-001: Course can be deleted only when it has no students.
    const hasStudents = await Enrollment.exists({ courseId: id, status: 'ACTIVE' });
    if (hasStudents) {
      return res.status(400).json({
        message: 'Course can be deleted only when it has no students.',
      });
    }

    // BR-003: Course can be deleted only when it has no AI index.
    const hasAiIndex = await CourseDocument.exists({ courseId: id });
    if (hasAiIndex) {
      return res.status(400).json({
        message: 'Course can be deleted only when it has no AI index.',
      });
    }

    // BR-004: Course can be deleted only when it has no quiz.
    const hasQuiz = await Quiz.exists({ courseId: id });
    if (hasQuiz) {
      return res.status(400).json({
        message: 'Course can be deleted only when it has no quiz.',
      });
    }

    // BR-005: Course can be deleted only when it has no chat history.
    const [hasQaHistory, hasQaRecord] = await Promise.all([
      QaHistory.exists({ courseId: id }),
      QaRecord.exists({ courseId: id }),
    ]);
    if (hasQaHistory || hasQaRecord) {
      return res.status(400).json({
        message: 'Course can be deleted only when it has no chat history.',
      });
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
      });
    }

    return res.json({
      message: 'Course deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Failed to delete course',
    });
  }
}
async function getUserDetail(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({
      data: buildUserResponse(user),
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve user details' });
  }
}

async function lockUser(req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only System Admin can lock accounts' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isLocked = true;
    await user.save();
    return res.json({
      message: 'User account locked successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to lock user' });
  }
}

async function unlockUser(req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only System Admin can unlock accounts' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isLocked = false;
    await user.save();
    return res.json({
      message: 'User account unlocked successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to unlock user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // BR-USER-05: Check if user has study history or QA history
    const Enrollment = require('../models/Enrollment');
    const QuizSession = require('../models/QuizSession');
    const QaHistory = require('../models/QaHistory');

    const [hasEnrollment, hasQuizSession, hasQaHistory] = await Promise.all([
      Enrollment.exists({ studentId: id }),
      QuizSession.exists({ studentId: id }),
      QaHistory.exists({ studentId: id }),
    ]);

    // As per BR-USER-05 and the endpoint description, soft delete marks status as INACTIVE.
    user.status = 'INACTIVE';
    await user.save();

    return res.json({
      message: 'User account soft-deleted (status set to INACTIVE) successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
}

async function restoreUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.status = 'ACTIVE';
    await user.save();
    return res.json({
      message: 'User account restored successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to restore user' });
  }
}

async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.passwordHash = await bcrypt.hash(String(password), 10);
    await user.save();
    return res.json({
      message: 'User password reset successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to reset user password' });
  }
}

async function listRoles(req, res) {
  try {
    const Role = require('../models/Role');
    const roles = await Role.find().populate('permissions');
    return res.json({ data: roles });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load roles' });
  }
}

async function createRole(req, res) {
  try {
    const Role = require('../models/Role');
    const { name, description, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    const normalizedName = String(name).trim().toUpperCase();
    const existingRole = await Role.findOne({ name: normalizedName });
    if (existingRole) {
      return res.status(409).json({ message: 'Role already exists' });
    }
    const role = await Role.create({
      name: normalizedName,
      description: description || '',
      permissions: permissions || [],
    });
    return res.status(201).json({ data: role });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create role' });
  }
}

async function getRoleDetail(req, res) {
  try {
    const Role = require('../models/Role');
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid role id' });
    }
    const role = await Role.findById(id).populate('permissions');
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    return res.json({ data: role });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load role detail' });
  }
}

async function updateRole(req, res) {
  try {
    const Role = require('../models/Role');
    const { id } = req.params;
    const { name, description } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid role id' });
    }
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    if (name) {
      role.name = String(name).trim().toUpperCase();
    }
    if (description !== undefined) {
      role.description = description;
    }
    await role.save();
    return res.json({ data: role });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update role' });
  }
}

async function deleteRole(req, res) {
  try {
    const Role = require('../models/Role');
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid role id' });
    }
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    // BR-ROLE-03: Cannot delete role that is currently assigned to users
    const userCount = await User.countDocuments({ role: role.name });
    if (userCount > 0) {
      return res
        .status(400)
        .json({ message: 'Cannot delete role that is currently assigned to users' });
    }
    await Role.findByIdAndDelete(id);
    return res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete role' });
  }
}

async function listPermissions(req, res) {
  try {
    const Permission = require('../models/Permission');
    const permissions = await Permission.find();
    return res.json({ data: permissions });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load permissions' });
  }
}

async function assignPermissionsToRole(req, res) {
  try {
    const Role = require('../models/Role');
    const { id } = req.params;
    const { permissions } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid role id' });
    }
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    role.permissions = permissions || [];
    await role.save();
    const populated = await Role.findById(role._id).populate('permissions');
    return res.json({ data: populated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Failed to assign permissions to role' });
  }
}

async function assignRoleToUser(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    const uppercaseRole = String(role).trim().toUpperCase();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = uppercaseRole;
    await user.save();
    return res.json({
      message: 'User role updated successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to assign role to user' });
  }
}

async function getCourseEnrollments(req, res) {
  try {
    const { id } = req.params; // courseId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ courseId: id, status: 'ACTIVE' }).populate(
      'studentId',
    );

    const mapped = enrollments.map((e) => ({
      id: e._id.toString(),
      courseId: e.courseId.toString(),
      studentId: e.studentId?._id?.toString() || e.studentId?.toString() || '',
      studentName: e.studentId?.fullName || 'Unknown Student',
      studentEmail: e.studentId?.email || '',
      createdAt: e.createdAt,
    }));

    return res.json({ data: mapped });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve enrollments' });
  }
}

async function saveCourseEnrollments(req, res) {
  try {
    const { id } = req.params; // courseId
    const { studentIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds must be an array' });
    }

    const Enrollment = require('../models/Enrollment');

    // Find current active enrollments
    const currentActive = await Enrollment.find({ courseId: id, status: 'ACTIVE' });
    const currentActiveIds = currentActive.map((e) => e.studentId.toString());

    // IDs to drop: currently active but not in new list
    const toDrop = currentActiveIds.filter((sid) => !studentIds.includes(sid));

    // IDs to add or reactivate: in new list
    const toEnroll = studentIds;

    // Drop old ones
    if (toDrop.length > 0) {
      await Enrollment.updateMany(
        { courseId: id, studentId: { $in: toDrop } },
        { $set: { status: 'DROPPED' } },
      );
    }

    // Process enrollments for new/reactivated
    for (const studentId of toEnroll) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) continue;

      const existing = await Enrollment.findOne({ courseId: id, studentId });
      if (existing) {
        if (existing.status !== 'ACTIVE') {
          existing.status = 'ACTIVE';
          await existing.save();
        }
      } else {
        await Enrollment.create({
          courseId: id,
          studentId,
          status: 'ACTIVE',
        });
      }
    }

    // Fetch updated list of active enrollments
    const enrollments = await Enrollment.find({ courseId: id, status: 'ACTIVE' }).populate(
      'studentId',
    );

    const mapped = enrollments.map((e) => ({
      id: e._id.toString(),
      courseId: e.courseId.toString(),
      studentId: e.studentId?._id?.toString() || e.studentId?.toString() || '',
      studentName: e.studentId?.fullName || 'Unknown Student',
      studentEmail: e.studentId?.email || '',
      createdAt: e.createdAt,
    }));

    return res.json({ data: mapped });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to save enrollments' });
  }
}

async function getStudentEnrollments(req, res) {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Student email is required' });
    }

    const User = require('../models/User');
    const Enrollment = require('../models/Enrollment');

    const student = await User.findOne({ email, role: 'STUDENT' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'ACTIVE',
    }).populate('studentId');

    const mapped = enrollments.map((e) => ({
      id: e._id.toString(),
      courseId: e.courseId.toString(),
      studentId: e.studentId?._id?.toString() || e.studentId?.toString() || '',
      studentName: e.studentId?.fullName || 'Unknown Student',
      studentEmail: e.studentId?.email || '',
      createdAt: e.createdAt,
    }));

    return res.json({ data: mapped });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Failed to retrieve student enrollments' });
  }
}

async function updateCourseStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.status = status;
    await course.save();

    return res.json({
      data: buildCourseResponse(course),
      course: buildCourseResponse(course),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update course status' });
  }
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
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getUserDetail,
  lockUser,
  unlockUser,
  deleteUser,
  restoreUser,
  resetUserPassword,
  listRoles,
  createRole,
  getRoleDetail,
  updateRole,
  deleteRole,
  listPermissions,
  assignPermissionsToRole,
  assignRoleToUser,
  getCourseEnrollments,
  saveCourseEnrollments,
  getStudentEnrollments,
  updateCourseStatus,
};
