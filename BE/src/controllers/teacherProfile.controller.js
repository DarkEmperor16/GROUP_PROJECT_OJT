const bcrypt = require('bcrypt');
const User = require('../models/User');
const Course = require('../models/Course');
const QaRecord = require('../models/QaRecord');
const QaFeedback = require('../models/QaFeedback');

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
}

function mapTeacherProfile(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    title: user.title || 'Giảng viên',
    major: user.major || '',
    teacherId: user.teacherId || `GV-${user._id.toString().slice(-6).toUpperCase()}`,
    photoUrl: user.photoUrl || '',
    mfaEnabled: Boolean(user.mfaEnabled),
    role: user.role,
    status: user.status,
  };
}

async function getTeacherProfile(req, res) {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  return res.json(mapTeacherProfile(user));
}

async function updateTeacherProfile(req, res) {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const nextFullName = normalizeText(req.body.fullName, user.fullName);
  const nextEmail = normalizeText(req.body.email, user.email).toLowerCase();

  if (!nextFullName) {
    return res.status(400).json({
      message: 'fullName is required',
    });
  }

  if (!nextEmail) {
    return res.status(400).json({
      message: 'email is required',
    });
  }

  const emailOwner = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });

  if (emailOwner) {
    return res.status(409).json({
      message: 'Email already exists',
    });
  }

  user.fullName = nextFullName;
  user.email = nextEmail;

  const nextTitle = normalizeOptionalText(req.body.title);
  if (nextTitle !== undefined) {
    user.title = nextTitle;
  }

  const nextMajor = normalizeOptionalText(req.body.major);
  if (nextMajor !== undefined) {
    user.major = nextMajor;
  }

  const nextPhotoUrl = normalizeOptionalText(req.body.photoUrl);
  if (nextPhotoUrl !== undefined) {
    user.photoUrl = nextPhotoUrl;
  }

  await user.save();

  return res.json({
    message: 'Profile updated successfully',
    profile: mapTeacherProfile(user),
  });
}

async function updateTeacherMfa(req, res) {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      message: 'enabled must be a boolean',
    });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  user.mfaEnabled = enabled;
  await user.save();

  return res.json({
    message: enabled ? 'MFA enabled' : 'MFA disabled',
    mfaEnabled: user.mfaEnabled,
  });
}

async function changeTeacherPassword(req, res) {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      message: 'oldPassword and newPassword are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: 'newPassword must be at least 6 characters',
    });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: 'Old password is incorrect',
    });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({
    message: 'Password changed successfully',
  });
}

async function getTeacherAiStatus(req, res) {
  const teacherId = req.user._id;

  const [courseIds, monthlySupportCount, qaFeedbackStats] = await Promise.all([
    Course.find({ teacherIds: teacherId, status: 'ACTIVE' }).select('_id').lean(),
    QaRecord.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
      courseId: {
        $in: await Course.find({ teacherIds: teacherId, status: 'ACTIVE' }).distinct('_id'),
      },
    }),
    QaFeedback.aggregate([
      {
        $match: {
          courseId: {
            $in: await Course.find({ teacherIds: teacherId, status: 'ACTIVE' }).distinct('_id'),
          },
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const helpful = qaFeedbackStats.find((item) => item._id === 'HELPFUL')?.count || 0;
  const notHelpful = qaFeedbackStats.find((item) => item._id === 'NOT_HELPFUL')?.count || 0;
  const total = helpful + notHelpful;

  return res.json({
    accuracy: total === 0 ? 0 : Number(((helpful / total) * 100).toFixed(2)),
    lectureCount: courseIds.length,
    monthlySupportCount,
  });
}

module.exports = {
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherMfa,
  changeTeacherPassword,
  getTeacherAiStatus,
};
