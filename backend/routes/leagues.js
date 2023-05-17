// backend/routes/leagues.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const League = require('../models/League');
const User = require('../models/User');
const Invitation = require('../models/Invitation');

// Create a league
router.post(
  '/',
  [
    auth,
    [
      check('name', 'League name is required').notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, invitations } = req.body;

      const newLeague = new League({
        name,
        admin: req.user.id,
        members: [req.user.id],
      });

      const league = await newLeague.save();

// Create separate invitations in the Invitation collection
const invitationPromises = invitations.map(async (invitation) => {
  const user = await User.findOne({ email: invitation.email });
  console.log('User found for email:', invitation.email, user);  
  console.log('User found:', user);

  const newInvitation = new Invitation({
    league: league._id,
    email: invitation.email,
    role: invitation.role,
    status: 'pending',
    user: user ? user._id : undefined,
  });

  return newInvitation.save();
});

await Promise.all(invitationPromises);

      res.json(league);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

// Get invites
router.get('/invitations', auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({ 
      $or: [
        { user: req.user.id },
        { email: req.user.email }
      ],
      status: 'pending' 
    })
    .populate('league', 'name'); 

    const pendingInvites = invitations.map(invitation => ({
      _id: invitation._id,
      league: {
        _id: invitation.league._id,
        name: invitation.league.name
      },
    }));

    res.json(pendingInvites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//Get league by ID
router.get('/:id', async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('admin', 'username email')
      .populate('members', 'username email');

    if (!league) {
      return res.status(404).json({ msg: 'League not found' });
    }

    res.json(league);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get invitations for a league
router.get('/:id/invitations', auth, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ msg: 'League not found' });
    }

    // Check if the logged-in user is a member of the league or has been invited to the league
    const isMember = league.members.some(member => member.toString() === req.user.id);
    const isInvited = await Invitation.exists({ user: req.user.id, league: req.params.id });

    if (!isMember && !isInvited) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const invitations = await Invitation.find({ league: req.params.id })
      .populate('user', 'username email'); 

    res.json(invitations);
  } catch (err) {
    console.error(err.message);
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
      const invitations = await Invitation.find({
        $or: [
          { user: req.user.id },
          { email: req.user.email },
        ],
        status: status,
      });      
    
      const leagueIds = invitations.map(invitation => invitation.league);
      query = { _id: { $in: leagueIds } };
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
    const invitation = await Invitation.findOne({ league: leagueId, user: userId, status: 'pending' });

    if (!league || !invitation) {
      return res.status(404).json({ msg: 'League or invitation not found' });
    }

    invitation.status = 'accepted';
    await invitation.save();

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
    const invitation = await Invitation.findOne({ league: leagueId, user: userId, status: 'pending' });

    if (!league || !invitation) {
      return res.status(404).json({ msg: 'League or invitation not found' });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.json(league);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a league
router.put(
  '/:leagueId',
  [
    auth,
    [
      check('name', 'League name is required').notEmpty(),
      check('invitations.*.email', 'Email is required in invitations').isEmail(),
      check('invitations.*.role', 'Role is required in invitations').isIn(['Admin', 'Member']),
      check('invitations.*.status', 'Status is required in invitations').isIn(['pending', 'accepted', 'declined']),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, invitations } = req.body;
      const leagueId = req.params.leagueId;

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({ msg: 'League not found' });
      }

      league.name = name;

      // Create new invitations in the Invitation collection for each new invitee
      const newInvitations = invitations.map(async (invite) => {
        const { email, role, status } = invite;
        const user = await User.findOne({ email });
        if (user) {
          return await Invitation.create({ email, role, status, league: leagueId, user: user._id });
        }
      });

      await Promise.all(newInvitations);

      await league.save();

      res.json(league);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Invite to existing league
router.post(
  '/:leagueId/invite',
  [
    auth,
    [
      check('email', 'Email is required').isEmail(),
      check('role', 'Role is required').isIn(['Admin', 'Member']),
      check('status', 'Status is required').isIn(['pending', 'accepted', 'declined']),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, role } = req.body;
      const leagueId = req.params.leagueId;

      const league = await League.findById(leagueId);
      if (!league) {
        return res.status(404).json({ msg: 'League not found' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Create a new invitation in the Invitation collection
      const invitation = await Invitation.create({
        email,
        role,
        user: user._id,
        status: 'pending',
        league: leagueId,
      });

      res.json(invitation);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Other API routes for update, delete, and fetch leagues will be added here

module.exports = router;
