const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // 👈 Changed from WhatsApp
    password: { type: String, required: true },
    role: { type: String, enum: ['player', 'admin'], default: 'player' },
    
    // OTP System Fields
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    
    stats: {
        playPoints: { type: Number, default: 0 },
        matchesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        draws: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
