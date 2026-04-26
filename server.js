const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // 👈 ADDED
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ MongoDB Connected'));

const Player = require('./models/Player');

// 📧 EMAIL TRANSPORTER SETUP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper Function: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// 🔹 OTP AUTHENTICATION ROUTES
// ==========================================

// 1. REGISTER (Send OTP to Email)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingPlayer = await Player.findOne({ $or: [{ username }, { email }] });
        if (existingPlayer && existingPlayer.isVerified) {
            return res.status(400).json({ error: 'Username or Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        if (existingPlayer && !existingPlayer.isVerified) {
            // Update unverified user
            existingPlayer.password = hashedPassword;
            existingPlayer.otp = otp;
            existingPlayer.otpExpires = otpExpires;
            await existingPlayer.save();
        } else {
            // Create new user
            const newPlayer = new Player({ username, email, password: hashedPassword, otp, otpExpires });
            await newPlayer.save();
        }

        // Send Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mystic Legends - Verify Your Account',
            text: `Your registration code is: ${otp}. It expires in 10 minutes.`
        });

        res.json({ message: 'Verification code sent to your email.', step: 'verify' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LOGIN (Send OTP to Email for 2FA)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const player = await Player.findOne({ email });
        if (!player) return res.status(400).json({ error: 'Account not found.' });

        const isMatch = await bcrypt.compare(password, player.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

        const otp = generateOTP();
        player.otp = otp;
        player.otpExpires = Date.now() + 10 * 60 * 1000;
        await player.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mystic Legends - Login Verification',
            text: `Your login code is: ${otp}. Do not share this with anyone.`
        });

        res.json({ message: 'Verification code sent to your email.', step: 'verify' });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// 3. VERIFY OTP (Used for both Login & Register)
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const player = await Player.findOne({ email });
        if (!player) return res.status(400).json({ error: 'User not found.' });

        if (player.otp !== otp || player.otpExpires < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        // Mark verified and clear OTP
        player.isVerified = true;
        player.otp = null;
        player.otpExpires = null;
        await player.save();

        // Generate Final JWT Token
        const token = jwt.sign({ id: player._id, role: player.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ message: 'Verification successful!', token, user: { username: player.username, role: player.role } });
    } catch (err) {
        res.status(500).json({ error: 'Server error during verification.' });
    }
});
