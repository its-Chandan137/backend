const express = require('express');
const User = require('../models/User'); // Import the User model
const router = express.Router(); // Create a router instance

// User registration/login endpoint
router.post('/', async (req, res) => {
  const { name } = req.body;
  const existingUser = await User.findOne({ name });

  if (existingUser) {
    // User exists, return existing user data
    return res.json({ message: 'User logged in successfully!', user: existingUser });
  }

  // User does not exist, register the new user
  const newUser = new User({ name });
  await newUser.save();
  res.json({ message: 'User registered successfully!', user: newUser });
});

module.exports = router; // Export the router
