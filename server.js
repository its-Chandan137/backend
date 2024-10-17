const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv'); // Added dotenv for environment variables
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const Message = require('./models/Message'); // Import Message model

dotenv.config(); // Load environment variables

// Connect to MongoDB using the new database specified in .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (adjust for production)
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/users', userRoutes);

// Socket.IO handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('message', async (data) => {
    const { sender, recipient, content } = data;

    const newMessage = new Message({ sender, recipient, content });
    await newMessage.save(); // Save the message to MongoDB

    // Emit the message back to the sender and recipient
    socket.emit('message', newMessage); // Send to the sender
    socket.broadcast.emit('message', newMessage); // Broadcast to others (recipient)
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API to fetch conversation history
app.get('/messages/:user', async (req, res) => {
  const { user } = req.params;
  const messages = await Message.find({
    $or: [{ sender: user }, { recipient: user }],
  }).sort({ timestamp: 1 });
  res.json(messages);
});

// Start the Express server
server.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

console.log(`Socket.IO server is running on ws://localhost:${process.env.SOCKET_PORT}`);
