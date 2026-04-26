const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    whatsappNumber: { type: String, required: true, unique: true }, // Crucial for your WhatsApp execution
    role: { type: String, enum: ['player', 'admin'], default: 'player' },
    
    // Quick Stats & Leaderboard Metrics
    stats: {
        playPoints: { type: Number, default: 0 },
        matchesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        goalsScored: { type: Number, default: 0 },
        goalsConceded: { type: Number, default: 0 },
    },
    
    // Advanced Profile
    form: { type: [String], default: [] }, // e.g., ['W', 'L', 'W', 'D', 'W'] (Last 5 matches)
    achievements: [{ type: String }], // e.g., 'Season 1 Champion'
    
    isActive: { type: Boolean, default: true } // For FC League mandatory participation
}, { timestamps: true });

// Virtual field to calculate Win Rate automatically
playerSchema.virtual('winRate').get(function() {
    if (this.stats.matchesPlayed === 0) return 0;
    return ((this.stats.wins / this.stats.matchesPlayed) * 100).toFixed(1);
});

module.exports = mongoose.model('Player', playerSchema);
