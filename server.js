const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());

app.use(express.json());
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);  // Add log here
  });





let users = {};

io.on('connection', (socket) => {
    console.log('New socket connection', socket.id);
  
    socket.on('join', ({ userId }) => {
      users[socket.id] = userId;
      socket.join(userId); // Join the room for the specific userId
      socket.broadcast.emit('userOnline', userId);
    });
  
    socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
      const message = { senderId, receiverId, text, timestamp: new Date() };
  
      // Emit the message to the receiver's room
      io.to(receiverId).emit('receiveMessage', message);
  
      // Save the message to MongoDB
      try {
        await mongoose.model('Message').create(message);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
      delete users[socket.id];
    });
  });
  

server.listen(5000, () => console.log('Server running on port 5000'));
