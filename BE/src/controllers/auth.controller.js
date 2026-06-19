const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../data/users');
const { addActivityLog } = require('../data/activityLogs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildUserResponse(user) {
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
    };
}

async function register(req, res) {
    const { fullName, email, password } = req.body;
    const ipAddress = req.ip;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            message: 'Full name, email and password are required',
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: 'Invalid email format',
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'Password must be at least 6 characters',
        });
    }

    const existingUser = users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.status(409).json({
            message: 'Email already exists',
        });
    }

    const newUser = {
        id: users.length + 1,
        fullName,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'STUDENT',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    users.push(newUser);

    addActivityLog({
        userId: newUser.id,
        action: 'REGISTER_SUCCESS',
        result: 'SUCCESS',
        ipAddress,
    });

    return res.status(201).json({
        message: 'Register successful',
        user: buildUserResponse(newUser),
    });
}

async function login(req, res) {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    if (!email || !password) {
        addActivityLog({
            action: 'LOGIN_FAILED',
            result: 'FAILED',
            ipAddress,
        });

        return res.status(400).json({
            message: 'Email and password are required',
        });
    }

    const user = users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
        addActivityLog({
            action: 'LOGIN_FAILED',
            result: 'FAILED',
            ipAddress,
        });

        return res.status(401).json({
            message: 'Invalid email or password',
        });
    }

    if (user.status !== 'ACTIVE') {
        addActivityLog({
            userId: user.id,
            action: 'LOGIN_FAILED',
            result: 'FAILED',
            ipAddress,
        });

        return res.status(403).json({
            message: 'Account is inactive',
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        addActivityLog({
            userId: user.id,
            action: 'LOGIN_FAILED',
            result: 'FAILED',
            ipAddress,
        });

        return res.status(401).json({
            message: 'Invalid email or password',
        });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
        },
        JWT_SECRET,
        {
            expiresIn: '1d',
        }
    );

    addActivityLog({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        result: 'SUCCESS',
        ipAddress,
    });

    return res.json({
        message: 'Login successful',
        accessToken: token,
        refreshToken: '',
        token,
        user: buildUserResponse(user),
    });
}

function me(req, res) {
    return res.json({
        user: buildUserResponse(req.user),
    });
}

function logout(req, res) {
    addActivityLog({
        userId: req.user?.id,
        action: 'LOGOUT',
        result: 'SUCCESS',
        ipAddress: req.ip,
    });

    return res.json({
        message: 'Logout successful',
    });
}

module.exports = {
    register,
    login,
    me,
    logout,
};
