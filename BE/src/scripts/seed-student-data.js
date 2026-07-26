/**
 * Seed Script for Student Development Data
 *
 * Populates MongoDB with sample Teachers, Courses, and Quizzes with embedded Questions.
 * Run: node src/scripts/seed-student-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const { connectDB } = require('../config/db');

async function seedStudentData() {
  try {
    console.log('🌱  Starting Student Data Seed Script…');
    await connectDB();

    // 1. Seed default accounts (Student, Teacher, Admin) with password '123456'
    console.log('\n👤  Seeding default users…');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const defaultUsers = [
      {
        fullName: 'Student User',
        email: 'student@academy.edu',
        passwordHash: defaultPasswordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Teacher User',
        email: 'teacher@academy.edu',
        passwordHash: defaultPasswordHash,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      {
        fullName: 'Admin User',
        email: 'admin@academy.edu',
        passwordHash: defaultPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    ];

    for (const userData of defaultUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`  ✅ Created User: [${userData.role}] ${userData.email}`);
      } else {
        console.log(`  ℹ️ User [${userData.email}] already exists`);
      }
    }

    let teacher = await User.findOne({ role: 'TEACHER' });


    // 2. Sample Courses
    const sampleCourses = [
      {
        title: 'Programming Fundamentals (C/C++)',
        code: 'PRF192',
        description: 'Introduction to procedural programming, variables, control structures, pointers, and memory management in C.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Cross-Platform Application Programming with .NET',
        code: 'PRN211',
        description: 'Building modern cross-platform applications using C#, .NET Core, LINQ, and ASP.NET Web APIs.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Software Development Project',
        code: 'SWP391',
        description: 'Capstone team project applying Agile/Scrum methodologies, full-stack architecture, and quality assurance.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
    ];

    console.log('\n📚  Seeding Courses…');
    const createdCourses = [];
    for (const courseData of sampleCourses) {
      const existing = await Course.findOne({ code: courseData.code });
      if (!existing) {
        const c = await Course.create(courseData);
        createdCourses.push(c);
        console.log(`  ✅ Created Course: [${c.code}] ${c.title}`);
      } else {
        createdCourses.push(existing);
        console.log(`  ℹ️ Course [${existing.code}] already exists`);
      }
    }

    // 3. Sample Quizzes
    console.log('\n📝  Seeding Quizzes…');

    const prfCourse = createdCourses.find((c) => c.code === 'PRF192');
    const prnCourse = createdCourses.find((c) => c.code === 'PRN211');

    const sampleQuizzes = [
      {
        title: 'PRF192 Midterm Practice Quiz',
        courseId: prfCourse._id,
        timeLimit: 15, // 15 minutes
        status: 'ACTIVE',
        questions: [
          {
            text: 'Which operator is used to get the memory address of a variable in C?',
            options: ['*', '&', '->', '%'],
            correctAnswer: 1, // index 1: '&'
            explanation: 'The address-of operator (&) returns the memory address of its operand.',
          },
          {
            text: 'What is the default return type of main() function in standard C?',
            options: ['void', 'int', 'float', 'char'],
            correctAnswer: 1, // index 1: 'int'
            explanation: 'In standard C (C99 and later), main() must return an integer status code to the OS.',
          },
          {
            text: 'Which function is used to allocate dynamic memory in C?',
            options: ['new()', 'malloc()', 'alloc()', 'memget()'],
            correctAnswer: 1, // index 1: 'malloc()'
            explanation: 'malloc() allocates a requested size of memory bytes and returns a void pointer to it.',
          },
        ],
      },
      {
        title: 'PRN211 Async/Await & LINQ Mastery',
        courseId: prnCourse._id,
        timeLimit: 20, // 20 minutes
        status: 'ACTIVE',
        questions: [
          {
            text: 'Which LINQ operator is used to filter sequences based on a predicate in C#?',
            options: ['Select', 'Where', 'GroupBy', 'OrderBy'],
            correctAnswer: 1, // index 1: 'Where'
            explanation: 'Where() filters elements in a sequence based on a boolean predicate.',
          },
          {
            text: 'What keyword enables asynchronous operation in a .NET method signature?',
            options: ['async', 'thread', 'task', 'parallel'],
            correctAnswer: 0, // index 0: 'async'
            explanation: 'The `async` modifier specifies that a method, lambda, or anonymous method is asynchronous.',
          },
        ],
      },
    ];

    for (const quizData of sampleQuizzes) {
      const existing = await Quiz.findOne({ title: quizData.title, courseId: quizData.courseId });
      if (!existing) {
        const q = await Quiz.create(quizData);
        console.log(`  ✅ Created Quiz: "${q.title}" (${q.questions.length} questions)`);
      } else {
        console.log(`  ℹ️ Quiz "${existing.title}" already exists`);
      }
    }

    // 4. Enrol the seed student in all seeded courses
    console.log('\n🎓  Seeding Enrollments…');
    const student = await User.findOne({ email: 'student@academy.edu' });

    if (student) {
      for (const course of createdCourses) {
        const existing = await Enrollment.findOne({
          studentId: student._id,
          courseId:  course._id,
        });
        if (!existing) {
          await Enrollment.create({
            studentId: student._id,
            courseId:  course._id,
            status:    'ACTIVE',
          });
          console.log(`  ✅ Enrolled student in: [${course.code}] ${course.title}`);
        } else {
          console.log(`  ℹ️ Already enrolled in: [${course.code}] ${course.title}`);
        }
      }
    } else {
      console.warn('  ⚠️  Seed student not found — skipping enrollment seeding.');
    }

    console.log('\n🎉  Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Seed script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedStudentData();
