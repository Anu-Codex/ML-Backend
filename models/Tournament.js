const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum:['Knockout', 'Group+Knockout', 'Swiss'], required: true },
    status: { type: String, enum:['Upcoming', 'Live', 'Completed'], default: 'Upcoming' },
    prizePool: { type: String, default: 'Glory' },
    
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    
    startDate: { type: Date },
    endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
