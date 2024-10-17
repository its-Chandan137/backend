const express = require('express');
const User = require('../models/User');
const router = express.Router();

// POST route to login or register a user
router.post('/login', async (req, res) => {
    console.log('POST /login hit');  // Add this log to check if the route is hit
    console.log('Request body:', req.body); 
  const { name, email } = req.body;

  try {
    // Check if user exists by email
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists, log them in (return user details)
      return res.json({ message: 'User logged in', user });
    } else {
      // User doesn't exist, create a new user
      user = new User({ name, email, password: 'defaultPassword' });
      await user.save();
      return res.json({ message: 'User created', user });
    }
  } catch (err) {
    console.error('Error logging in or registering user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
    try {
      const users = await User.find(); // Fetch all users
      res.json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;
