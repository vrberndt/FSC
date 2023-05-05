// backend/models/League.js
const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },

  invitations: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      email: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ['Admin', 'Member'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model('League', LeagueSchema);
