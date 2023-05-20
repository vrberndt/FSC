// backend/models/League.js
const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  invitations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('League', LeagueSchema);
