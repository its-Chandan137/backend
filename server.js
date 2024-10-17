const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const multer = require('multer'); // Add multer for file upload
const path = require('path'); // To manage file paths
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);  // Add log here
  });


// Multer storage configuration for saving files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Make sure the path exists
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Use unique filenames
    }
  });
  
  const upload = multer({ storage });


let users = {};

io.on('connection', (socket) => {
    console.log('New socket connection', socket.id);
  
    socket.on('join', ({ userId }) => {
      users[socket.id] = userId;
      socket.join(userId); // Join the room for the specific userId
      socket.broadcast.emit('userOnline', userId);
    });
  
    socket.on('sendMessage', async ({ senderId, receiverId, text, file }) => {
      const message = { senderId, receiverId, text, fileUrl: file || '', timestamp: new Date() };
  
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

  app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Send back the file path to the client
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
  });

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

server.listen(5000, () => console.log('Server running on port 5000'));
