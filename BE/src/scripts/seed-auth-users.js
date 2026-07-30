require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const { connectDB } = require('../config/db');

async function seedAuthUsers() {
    try {
        await connectDB();

        const passwordHash = await bcrypt.hash('123456', 10);

        const users = [
            {
                fullName: 'Student User',
                email: 'student@academy.edu',
                role: 'STUDENT',
            },
            {
                fullName: 'Teacher User',
                email: 'teacher@academy.edu',
                role: 'TEACHER',
            },
            {
                fullName: 'Admin User',
                email: 'admin@academy.edu',
                role: 'ADMIN',
            },
        ];

        for (const user of users) {
            await User.findOneAndUpdate(
                { email: user.email },
                {
                    $set: {
                        fullName: user.fullName,
                        email: user.email,
                        passwordHash,
                        role: user.role,
                        status: 'ACTIVE',
                    },
                },
                {
                    upsert: true,
                    new: true,
                },
            );

            console.log(`Seeded ${user.role}: ${user.email} / 123456`);
        }

        console.log('Seed auth users completed');
    } catch (error) {
        console.error('Seed auth users failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

seedAuthUsers();