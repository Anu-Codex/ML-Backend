const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: false },
    leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: false }, // If it's a league match
    
    playerA: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    playerB: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    
    scoreA: { type: Number, default: null },
    scoreB: { type: Number, default: null },
    
    scheduledTime: { type: Date },
    status: { type: String, enum: ['Pending', 'Completed', 'Disputed'], default: 'Pending' },
    
    proofUrl: { type: String }, // Screenshot link if uploaded via web or admin dash
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' } // Who submitted the score
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
