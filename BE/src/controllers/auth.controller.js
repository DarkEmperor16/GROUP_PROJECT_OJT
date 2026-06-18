const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../data/users');
const { addActivityLog } = require('../data/activityLogs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function buildUserResponse(user) {
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
    };
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
    login,
    me,
    logout,
};