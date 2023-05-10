// backend/routes/leagues.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const League = require('../models/League');
const User = require('../models/User');

// Create a league

router.post(
  '/',
  [
    auth,
    [
      check('name', 'League name is required').notEmpty(),
      check('invitations.*.email', 'Email is required in invitations').isEmail(),
      check('invitations.*.role', 'Role is required in invitations').isIn(['Admin', 'Member']),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, invitations } = req.body;

      // Find the user IDs by their email addresses
      const userIdsAndInvitations = await Promise.all(
        invitations.map(async (invitation) => {
          const user = await User.findOne({ email: invitation.email });
          return user ? { ...invitation, user: user._id } : null;
        })
      );

      // Filter out invitations where the user was not found
      const validInvitations = userIdsAndInvitations.filter((invitation) => invitation !== null);
      console.log('Valid invitations:', validInvitations);

      const newLeague = new League({
        name,
        admin: req.user.id,
        members: [req.user.id],
        invitations: validInvitations.map((invitation) => ({
          ...invitation,
          status: 'pending',
        })),
      });

      const league = await newLeague.save();
      console.log('Created league with invitations:', league);
      res.json(league);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Get invites
router.get('/invitations', auth, async (req, res) => {
  try {
    const leagues = await League.find({ 'invitations.user': req.user.id });
    const pendingInvites = leagues
      .map((league) => {
        const invitation = league.invitations.find(
          (invitation) => invitation.user.toString() === req.user.id && invitation.status === 'pending'
        );

        return invitation ? { _id: invitation._id, league: { _id: league._id, name: league.name } } : null;
      })
      .filter((invite) => invite !== null);

    console.log("Pending invites sent to frontend:", pendingInvites); 
    res.json(pendingInvites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get league by ID
router.get('/:leagueId', auth, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId).populate('members', 'email role');
    if (!league) {
      return res.status(404).json({ msg: 'League not found' });
    }
    res.json(league);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'League not found' });
    }
    res.status(500).send('Server error');
  }
});

// GET leagues by status
router.get('/', auth, async (req, res) => {
  try {
    const status = req.query.status;
    let query;

    if (status === "accepted") {
      query = {
        $or: [
          { members: { $in: [req.user.id] } },
          { admin: req.user.id },
        ],
      };
    } else {
      query = {
        'invitations.user': req.user.id,
        'invitations.status': status,
      };
    }

    const leagues = await League.find(query);
    res.json(leagues);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Join a league
router.put('/:leagueId/join', auth, async (req, res) => {
  try {
    console.log('User email:', req.user.email);
    const leagueId = req.params.leagueId;
    const userId = req.user.id;

    const league = await League.findById(leagueId);

    if (!league) {
      return res.status(404).json({ msg: 'League not found' });
    }

    console.log('User email:', req.user.email);
    console.log('League invitations:', league.invitations);  

    const invitationIndex = league.invitations.findIndex(
      (invitation) => invitation.email === req.user.email && invitation.status === 'pending' 
      );

    if (invitationIndex === -1) {
      return res.status(400).json({ msg: 'No pending invitation found for this user' });
    }

    league.invitations[invitationIndex].status = 'accepted';
    league.members.push(userId);

    await league.save();

    res.json(league);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Decline a league
router.put('/:leagueId/decline', auth, async (req, res) => {
  try {
    console.log('User email:', req.user.email);
    const leagueId = req.params.leagueId;
    const userId = req.user.id;

    const league = await League.findById(leagueId);

    if (!league) {
      return res.status(404).json({ msg: 'League not found' });
    }

    console.log('User email:', req.user.email);
    console.log('League invitations:', league.invitations);  

    const invitationIndex = league.invitations.findIndex(
      (invitation) => invitation.email === req.user.email && invitation.status === 'pending' 
    );

    if (invitationIndex === -1) {
      return res.status(400).json({ msg: 'No pending invitation found for this user' });
    }

    league.invitations[invitationIndex].status = 'declined';

    await league.save();

    res.json(league);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Other API routes for update, delete, and fetch leagues will be added here

module.exports = router;
