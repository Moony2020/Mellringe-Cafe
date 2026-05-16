const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static assets explicitly to keep root folder secure
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
        res.sendFile(faviconPath);
    } else {
        res.status(204).end();
    }
});

// Create uploads folder if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Set up Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Admin Schema
const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', AdminSchema);

// MongoDB Connection
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(async () => {
            console.log('MongoDB Connected');
            // Seed admin if not exists
            const adminExists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
            if (!adminExists) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
                await Admin.create({ username: process.env.ADMIN_USERNAME, password: hashedPassword });
                console.log('Admin account created from .env');
            }
        })
        .catch(err => console.log(err));
} else {
    console.warn("MONGO_URI not found in .env. Running without database connection.");
}

// Menu Item Schema
const MenuItemSchema = new mongoose.Schema({
    category: { type: String, required: true }, // e.g., 'Manakish', 'Veg'
    categoryIcon: { type: String }, // e.g., '🫓'
    categoryImage: { type: String }, // Optional header image for category
    name: { type: String, required: true }, // e.g., 'Zaatar'
    price: { type: String, required: true }, // e.g., '20 kr'
    image: { type: String } // Optional specific image for the item
});
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

// Admin Auth Middleware
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') throw new Error('Not admin');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Forbidden' });
    }
};

// Routes

// 1. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!process.env.MONGO_URI) {
            // Fallback to .env if DB not connected
            if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
                const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ token });
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Password
app.put('/api/auth/password', verifyAdmin, async (req, res) => {
    try {
        if (!process.env.MONGO_URI) return res.status(400).json({ message: 'Database required to change password' });

        const { oldPassword, newPassword } = req.body;
        const admin = await Admin.findOne({ username: req.user.username });

        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Felaktigt gammalt lösenord' });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.json({ message: 'Lösenord ändrat' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Menu
app.get('/api/menu', async (req, res) => {
    try {
        if (!process.env.MONGO_URI) {
            return res.json([]); // Return empty if no DB yet
        }
        const items = await MenuItem.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Add Menu Item (Admin only)
app.post('/api/menu', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { category, categoryIcon, name, price } = req.body;
        const imagePath = req.file ? '/uploads/' + req.file.filename : null;

        const newItem = new MenuItem({
            category,
            categoryIcon: categoryIcon || '🍽️',
            name,
            price,
            image: imagePath
        });

        await newItem.save();
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Update Menu Item (Admin only)
app.put('/api/menu/:id', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { category, categoryIcon, name, price } = req.body;
        const updateData = { category, categoryIcon, name, price };
        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Delete Menu Item (Admin only)
app.delete('/api/menu/:id', verifyAdmin, async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
