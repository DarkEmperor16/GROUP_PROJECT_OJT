const bcrypt = require('bcrypt');

const users = [
    {
        id: 1,
        fullName: 'Student User',
        email: 'student@example.com',
        passwordHash: bcrypt.hashSync('123456', 10),
        role: 'STUDENT',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 2,
        fullName: 'Teacher User',
        email: 'teacher@example.com',
        passwordHash: bcrypt.hashSync('123456', 10),
        role: 'TEACHER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 3,
        fullName: 'Admin User',
        email: 'admin@example.com',
        passwordHash: bcrypt.hashSync('123456', 10),
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

module.exports = users;