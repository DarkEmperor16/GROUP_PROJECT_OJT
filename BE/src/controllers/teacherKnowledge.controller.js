const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseDocument = require('../models/CourseDocument');
const { buildIndexPayload, requestDocumentIndex, notifyDocumentStatusChange } = require('../services/ai.service');

const DOCUMENT_STATUSES = new Set(['uploaded', 'processing', 'active', 'failed', 'inactive']);
const TEACHER_ALLOWED_DOCUMENT_STATUSES = new Set(['active', 'inactive']);

function formatDocumentResponse(document) {
  return {
    id: document._id,
    courseId: document.courseId,
    uploadedBy: document.uploadedBy,
    title: document.title,
    version: document.version,
    description: document.description,
    fileName: document.fileName,
    storagePath: document.storagePath,
    mimeType: document.mimeType,
    size: document.size,
    status: document.status,
    aiRequestId: document.aiRequestId,
    aiErrorMessage: document.aiErrorMessage,
    indexedAt: document.indexedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function findCourseAndAuthorizeTeacher(courseId, userId) {
  const course = await Course.findById(courseId);

  if (!course) {
    return { error: { statusCode: 404, message: 'Course not found' } };
  }

  if (course.status !== 'ACTIVE') {
    return { error: { statusCode: 409, message: 'Course is inactive' } };
  }

  const isAssignedTeacher = course.teacherIds.some((teacherId) => teacherId.toString() === userId.toString());

  if (!isAssignedTeacher) {
    return { error: { statusCode: 403, message: 'You are not assigned to this course' } };
  }

  return { course };
}

async function uploadDocument(req, res) {
  const { courseId } = req.params;
  const { title, version, description = '' } = req.body;

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({
      message: 'Invalid courseId',
    });
  }

  if (!title || !version) {
    return res.status(400).json({
      message: 'title and version are required',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: 'Document file is required',
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const document = await CourseDocument.create({
    courseId: auth.course._id,
    uploadedBy: req.user._id,
    title,
    version,
    description,
    fileName: req.file.originalname,
    storagePath: path.relative(process.cwd(), req.file.path),
    mimeType: req.file.mimetype,
    size: req.file.size,
    status: 'uploaded',
  });

  const payload = buildIndexPayload(document, auth.course, req.user);
  const aiResult = await requestDocumentIndex(payload);

  if (aiResult.accepted) {
    document.status = 'processing';
    document.aiRequestId = aiResult.requestId;
    document.aiErrorMessage = null;
  } else {
    document.status = 'failed';
    document.aiErrorMessage = aiResult.errorMessage;
  }

  await document.save();

  return res.status(201).json({
    message: 'Document uploaded successfully',
    document: formatDocumentResponse(document),
  });
}

async function listCourseDocuments(req, res) {
  const { courseId } = req.params;
  const status = req.query.status;

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({
      message: 'Invalid courseId',
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  const filter = { courseId: auth.course._id };

  if (status) {
    if (!DOCUMENT_STATUSES.has(status)) {
      return res.status(400).json({
        message: 'Invalid status filter',
      });
    }

    filter.status = status;
  }

  const documents = await CourseDocument.find(filter).sort({ createdAt: -1 });

  return res.json({
    documents: documents.map(formatDocumentResponse),
  });
}

async function getDocumentDetail(req, res) {
  const { documentId } = req.params;

  if (!isValidObjectId(documentId)) {
    return res.status(400).json({
      message: 'Invalid documentId',
    });
  }

  const document = await CourseDocument.findById(documentId).populate('courseId');

  if (!document) {
    return res.status(404).json({
      message: 'Document not found',
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(document.courseId._id, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  return res.json({
    document: formatDocumentResponse(document),
  });
}

async function reindexDocument(req, res) {
  const { documentId } = req.params;

  if (!isValidObjectId(documentId)) {
    return res.status(400).json({
      message: 'Invalid documentId',
    });
  }

  const document = await CourseDocument.findById(documentId);

  if (!document) {
    return res.status(404).json({
      message: 'Document not found',
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(document.courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  if (document.status === 'processing') {
    return res.status(409).json({
      message: 'Document is already processing',
    });
  }

  const payload = buildIndexPayload(document, auth.course, req.user);
  const aiResult = await requestDocumentIndex(payload);

  if (aiResult.accepted) {
    document.status = 'processing';
    document.aiRequestId = aiResult.requestId;
    document.aiErrorMessage = null;
  } else {
    document.status = 'failed';
    document.aiErrorMessage = aiResult.errorMessage;
  }

  await document.save();

  return res.json({
    message: aiResult.accepted ? 'Reindex request submitted' : 'Reindex failed',
    document: formatDocumentResponse(document),
  });
}

async function updateDocumentActiveStatus(req, res) {
  const { documentId } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(documentId)) {
    return res.status(400).json({
      message: 'Invalid documentId',
    });
  }

  if (!TEACHER_ALLOWED_DOCUMENT_STATUSES.has(status)) {
    return res.status(400).json({
      message: 'Teacher can only set document status to active or inactive',
    });
  }

  const document = await CourseDocument.findById(documentId);

  if (!document) {
    return res.status(404).json({
      message: 'Document not found',
    });
  }

  const auth = await findCourseAndAuthorizeTeacher(document.courseId, req.user._id);

  if (auth.error) {
    return res.status(auth.error.statusCode).json({ message: auth.error.message });
  }

  if (document.status === status) {
    return res.json({
      message: 'Document status unchanged',
      document: formatDocumentResponse(document),
    });
  }

  const aiResult = await notifyDocumentStatusChange({
    documentId: document._id.toString(),
    courseId: auth.course._id.toString(),
    status,
    updatedBy: req.user._id.toString(),
  });

  if (!aiResult.accepted) {
    return res.status(502).json({
      message: aiResult.errorMessage,
    });
  }

  document.status = status;

  if (status === 'active') {
    document.aiErrorMessage = null;
    document.indexedAt = document.indexedAt || new Date();
  }

  await document.save();

  return res.json({
    message: 'Document status updated successfully',
    document: formatDocumentResponse(document),
  });
}

async function updateDocumentStatus(req, res) {
  const { documentId } = req.params;
  const { status, errorMessage = null } = req.body;

  if (!isValidObjectId(documentId)) {
    return res.status(400).json({
      message: 'Invalid documentId',
    });
  }

  if (!DOCUMENT_STATUSES.has(status)) {
    return res.status(400).json({
      message: 'Invalid document status',
    });
  }

  if (process.env.INTERNAL_API_TOKEN) {
    const token = req.headers['x-internal-token'];

    if (token !== process.env.INTERNAL_API_TOKEN) {
      return res.status(401).json({
        message: 'Unauthorized internal callback',
      });
    }
  }

  const document = await CourseDocument.findById(documentId);

  if (!document) {
    return res.status(404).json({
      message: 'Document not found',
    });
  }

  document.status = status;
  document.aiErrorMessage = status === 'failed' ? errorMessage || 'Unknown AI indexing error' : null;

  if (status === 'active') {
    document.indexedAt = new Date();
  }

  await document.save();

  return res.json({
    message: 'Document status updated',
    document: formatDocumentResponse(document),
  });
}

module.exports = {
  uploadDocument,
  listCourseDocuments,
  getDocumentDetail,
  reindexDocument,
  updateDocumentActiveStatus,
  updateDocumentStatus,
};
