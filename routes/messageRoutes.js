// messageRoutes.js
const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// Route to get messages between two users
router.get('/:userId/:receiverId', async (req, res) => {
  const { userId, receiverId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to send a new message
router.post('/', async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const newMessage = new Message({
    senderId,
    receiverId,
    text,
    timestamp: new Date(),
  });

  try {
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage); // Return the saved message
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
