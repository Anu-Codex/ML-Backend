const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allows frontend to fetch data
app.use(express.json()); // Parses incoming JSON requests

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI,
    ).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Connection Error:', err));

// --- API ROUTES ---

// 1. Get Top Players for Leaderboard
app.get('/api/leaderboard', async (req, res) => {
    const Player = require('./models/Player');
    try {
        const topPlayers = await Player.find()
            .sort({ 'stats.playPoints': -1, 'stats.goalDifference': -1 })
            .limit(10);
        res.json(topPlayers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Live & Upcoming Tournaments
app.get('/api/tournaments', async (req, res) => {
    const Tournament = require('./models/Tournament');
    try {
        const tournaments = await Tournament.find({ status: { $in: ['Live', 'Upcoming'] } })
            .populate('participants', 'username');
        res.json(tournaments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ADMIN: Approve Match Result & Auto-Update Standings (Step 9)
app.post('/api/admin/match/approve', async (req, res) => {
    const Match = require('./models/Match');
    const Player = require('./models/Player');
    const { matchId, scoreA, scoreB } = req.body;

    try {
        const match = await Match.findById(matchId);
        match.scoreA = scoreA;
        match.scoreB = scoreB;
        match.status = 'Completed';
        await match.save();

        // System auto-updates PlayPoints & Stats
        const playerA = await Player.findById(match.playerA);
        const playerB = await Player.findById(match.playerB);

        playerA.stats.matchesPlayed += 1;
        playerB.stats.matchesPlayed += 1;
        playerA.stats.goalsScored += scoreA;
        playerA.stats.goalsConceded += scoreB;
        playerB.stats.goalsScored += scoreB;
        playerB.stats.goalsConceded += scoreA;

        if (scoreA > scoreB) {
            playerA.stats.wins += 1;
            playerA.stats.playPoints += 3;
            playerB.stats.losses += 1;
        } else if (scoreB > scoreA) {
            playerB.stats.wins += 1;
            playerB.stats.playPoints += 3;
            playerA.stats.losses += 1;
        } else {
            playerA.stats.draws += 1;
            playerB.stats.draws += 1;
            playerA.stats.playPoints += 1;
            playerB.stats.playPoints += 1;
        }

        await playerA.save();
        await playerB.save();

        res.json({ message: '✅ Match approved and stats automatically updated!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
