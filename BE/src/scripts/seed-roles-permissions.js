require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { connectDB } = require('../config/db');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');

const defaultPermissions = [
  // User Management
  { name: 'users:read', description: 'View user list and details', module: 'User Management' },
  { name: 'users:create', description: 'Create user account', module: 'User Management' },
  { name: 'users:update', description: 'Edit user information', module: 'User Management' },
  { name: 'users:lock', description: 'Lock/Unlock user accounts', module: 'User Management' },
  { name: 'users:delete', description: 'Soft delete user accounts', module: 'User Management' },
  {
    name: 'users:restore',
    description: 'Restore soft-deleted user accounts',
    module: 'User Management',
  },
  { name: 'users:reset-password', description: 'Reset user passwords', module: 'User Management' },
  { name: 'users:assign-role', description: 'Assign roles to users', module: 'User Management' },

  // Role & Permission Management
  { name: 'roles:read', description: 'View role list and details', module: 'Role Management' },
  { name: 'roles:create', description: 'Create system roles', module: 'Role Management' },
  { name: 'roles:update', description: 'Update role details', module: 'Role Management' },
  { name: 'roles:delete', description: 'Delete unused roles', module: 'Role Management' },
  {
    name: 'roles:assign-permissions',
    description: 'Assign permissions to roles',
    module: 'Role Management',
  },
  {
    name: 'permissions:read',
    description: 'View available permissions',
    module: 'Role Management',
  },
];

async function seedRolesPermissions() {
  try {
    await connectDB();
    console.log('Connected to Database.');

    // 1. Seed Permissions
    console.log('Seeding permissions...');
    const dbPermissions = [];
    for (const p of defaultPermissions) {
      const doc = await Permission.findOneAndUpdate(
        { name: p.name },
        { $set: p },
        { upsert: true, new: true },
      );
      dbPermissions.push(doc);
    }
    console.log(`Successfully seeded ${dbPermissions.length} permissions.`);

    // Map permissions by name for easier lookup
    const permMap = {};
    dbPermissions.forEach((p) => {
      permMap[p.name] = p._id;
    });

    // 2. Define Roles and assign permission references
    const adminPermissions = dbPermissions.map((p) => p._id);

    const rolesToSeed = [
      {
        name: 'ADMIN',
        description: 'System Administrator - Full Access',
        permissions: adminPermissions,
      },
      {
        name: 'TEACHER',
        description: 'Teacher / Instructor role',
        permissions: [],
      },
      {
        name: 'STUDENT',
        description: 'Student / Learner role',
        permissions: [],
      },
    ];

    console.log('Seeding roles...');
    for (const r of rolesToSeed) {
      await Role.findOneAndUpdate({ name: r.name }, { $set: r }, { upsert: true, new: true });
      console.log(`Seeded role: ${r.name}`);
    }

    // 3. Create or Update Default Users
    console.log('Seeding users and linking roles...');
    const passwordHash = await bcrypt.hash('123456', 10);

    const defaultUsers = [
      {
        fullName: 'Admin User',
        email: 'admin@academy.edu',
        role: 'ADMIN',
      },
      {
        fullName: 'Teacher User',
        email: 'teacher@academy.edu',
        role: 'TEACHER',
      },
      {
        fullName: 'Student User',
        email: 'student@academy.edu',
        role: 'STUDENT',
      },
    ];

    for (const u of defaultUsers) {
      const user = await User.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            fullName: u.fullName,
            email: u.email,
            passwordHash,
            role: u.role,
            status: 'ACTIVE',
            isLocked: false,
          },
        },
        { upsert: true, new: true },
      );
      console.log(`Seeded user ${user.role}: ${user.email} (Password: 123456)`);
    }

    console.log('Seed roles and permissions completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed roles and permissions:', error);
    process.exit(1);
  }
}

seedRolesPermissions();
