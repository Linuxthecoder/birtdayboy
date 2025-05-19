require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary configuration
console.log({
  cloud_name: 'dfpb7rgll',
  api_key: '674644266213533',
  api_secret: '_0HK2vQmiAcUnpvrySSqBT6OgNs'
});
cloudinary.config({
    cloud_name: 'dfpb7rgll',
    api_key: '674644266213533',
    api_secret: '_0HK2vQmiAcUnpvrySSqBT6OgNs'
});

// Verify Cloudinary configuration
cloudinary.api.ping()
    .then(() => console.log('Connected to Cloudinary'))
    .catch(err => {
        console.error('Cloudinary connection error:', err);
        process.exit(1);
    });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection with error handling
const MONGODB_URI = 'mongodb+srv://Nexora:7Ib1bRpd3RtXe0nV@galaxycluster01.8pz68zq.mongodb.net/birtday?retryWrites=true&w=majority&appName=Galaxycluster01';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Photo Schema
const photoSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Photo = mongoose.model('Photo', photoSchema);

// Guestbook Message Schema
const messageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Routes
app.get('/api/photos', async (req, res) => {
    try {
        const photos = await Photo.find().sort({ timestamp: -1 });
        res.json(photos);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Error fetching photos' });
    }
});

// New route for handling photo uploads
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary with specific options
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'birthday_photos',
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
            overwrite: true
        });

        // Save to MongoDB
        const photo = new Photo({
            imageUrl: result.secure_url,
            userName: req.body.userName,
            timestamp: new Date()
        });
        await photo.save();

        res.json({
            success: true,
            photo: {
                imageUrl: result.secure_url,
                userName: req.body.userName,
                timestamp: photo.timestamp
            }
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Error uploading photo: ' + error.message });
    }
});

// Get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Post a new message
app.post('/api/messages', async (req, res) => {
    try {
        const { name, message } = req.body;
        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }
        const newMessage = new Message({ name, message });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 