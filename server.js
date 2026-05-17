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

// Create uploads folder if it doesn't exist (fails silently on read-only serverless filesystems)
try {
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
    }
} catch (err) {
    console.warn('Uploads directory creation skipped (read-only filesystem):', err.message);
}

const ADMIN_AUTH_STORE_PATH = path.join(__dirname, 'admin-auth.json');

function getLocalAdminAuth() {
    const fallback = {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
    };

    try {
        if (!fs.existsSync(ADMIN_AUTH_STORE_PATH)) {
            return fallback;
        }
        const raw = fs.readFileSync(ADMIN_AUTH_STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed?.username || !parsed?.password) {
            return fallback;
        }
        return parsed;
    } catch (err) {
        console.warn('Could not read local admin auth store:', err.message);
        return fallback;
    }
}

function saveLocalAdminAuth(data) {
    fs.writeFileSync(ADMIN_AUTH_STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Set up Multer for memory storage (Netlify Serverless compatible)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Admin Schema
const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

// MongoDB Connection Middleware (Serverless/Netlify compatible)
let isConnected = false;
const connectDB = async (req, res, next) => {
    // If database is already connected, bypass
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return next();
    }

    try {
        if (!process.env.MONGO_URI) {
            console.warn("MONGO_URI not found in environment variables. Running in fallback mode.");
            return next();
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 4000
        });
        isConnected = true;
        console.log('MongoDB Connected');

        // Seed admin if not exists
        const adminExists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
            await Admin.create({ username: process.env.ADMIN_USERNAME, password: hashedPassword });
            console.log('Admin account created from middleware seed');
        }

        // Seed missing defaults
        await seedMissingDefaultMenuItems();
        next();
    } catch (err) {
        console.error('Database connection failed in middleware:', err.message);
        res.status(500).json({ error: 'Database connection failed: ' + err.message });
    }
};

app.use(connectDB);

// Menu Item Schema
const MenuItemSchema = new mongoose.Schema({
    category: { type: String, required: true }, // e.g., 'Manakish', 'Veg'
    categoryIcon: { type: String }, // e.g., '🫓'
    categoryImage: { type: String }, // Optional header image for category
    categoryPrice: { type: String }, // e.g., 'Från 15 kr'
    name: { type: String, required: true }, // e.g., 'Zaatar'
    price: { type: String, required: true }, // e.g., '20 kr'
    image: { type: String }, // Optional specific image for the item
    sortOrder: { type: Number, default: 0 },
    categoryOrder: { type: Number, default: 999 }
});
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);

const menuSseClients = new Set();

function broadcastMenuUpdated(eventType = 'updated') {
    const payload = `event: menu-update\ndata: ${JSON.stringify({ type: eventType, ts: Date.now() })}\n\n`;
    menuSseClients.forEach((client) => {
        try {
            client.write(payload);
        } catch (err) {
            menuSseClients.delete(client);
        }
    });
}

function loadDefaultMenuItemsForSeed() {
    try {
        const dataPath = path.join(__dirname, 'data-default.json');
        if (!fs.existsSync(dataPath)) return [];

        const raw = fs.readFileSync(dataPath, 'utf8');
        const parsed = JSON.parse(raw);
        const categories = Array.isArray(parsed?.menu) ? parsed.menu : [];

        const items = [];
        categories.forEach((cat, categoryIndex) => {
            const categoryName = String(cat?.title || '').trim();
            if (!categoryName) return;

            const categoryIcon = cat?.icon || '🍽️';
            const categoryImage = cat?.image || null;
            const categoryPrice = cat?.price || null;
            const categoryItems = Array.isArray(cat?.items) ? cat.items : [];

            categoryItems.forEach((entry, index) => {
                if (!Array.isArray(entry) || entry.length < 2) return;

                const name = String(entry[0] || '').trim();
                const price = String(entry[1] || '').trim();
                if (!name || !price) return;

                items.push({
                    category: categoryName,
                    categoryIcon,
                    categoryImage,
                    categoryPrice,
                    name,
                    price,
                    image: null,
                    sortOrder: index,
                    categoryOrder: categoryIndex
                });
            });
        });

        return items;
    } catch (err) {
        console.warn('Could not load default menu seed data:', err.message);
        return [];
    }
}

async function seedMissingDefaultMenuItems() {
    const seedItems = loadDefaultMenuItemsForSeed();
    if (seedItems.length === 0) {
        console.warn('Menu seed skipped: no default menu items found.');
        return { insertedCount: 0, totalDefaults: 0 };
    }

    const existingItems = await MenuItem.find({}, { category: 1, name: 1, price: 1 }).lean();
    const existingKeys = new Set(
        existingItems.map((item) => `${String(item.category || '').trim().toLowerCase()}::${String(item.name || '').trim().toLowerCase()}`)
    );

    const missing = seedItems.filter((item) => {
        const key = `${String(item.category || '').trim().toLowerCase()}::${String(item.name || '').trim().toLowerCase()}`;
        return !existingKeys.has(key);
    });

    if (missing.length > 0) {
        await MenuItem.insertMany(missing);
        console.log(`Seeded ${missing.length} missing default menu items into MongoDB.`);
    }

    return { insertedCount: missing.length, totalDefaults: seedItems.length };
}

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
            const localAuth = getLocalAdminAuth();
            if (username === localAuth.username && password === localAuth.password) {
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
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new password are required' });
        }

        if (!process.env.MONGO_URI) {
            const localAuth = getLocalAdminAuth();
            if (oldPassword !== localAuth.password) {
                return res.status(400).json({ message: 'Felaktigt gammalt lösenord' });
            }

            saveLocalAdminAuth({
                username: localAuth.username,
                password: newPassword
            });

            return res.json({ message: 'Lösenord ändrat' });
        }

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
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        if (!process.env.MONGO_URI) {
            return res.json([]); // Return empty if no DB yet
        }
        const items = await MenuItem.find().sort({ categoryOrder: 1, category: 1, sortOrder: 1, _id: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/menu/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    res.write(`event: menu-update\ndata: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);
    menuSseClients.add(res);

    const heartbeat = setInterval(() => {
        try {
            res.write(': ping\n\n');
        } catch (err) {
            clearInterval(heartbeat);
            menuSseClients.delete(res);
        }
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        menuSseClients.delete(res);
    });
});

// 2.1 Sync missing defaults into DB (Admin only)
app.post('/api/menu/sync-defaults', verifyAdmin, async (req, res) => {
    try {
        if (!process.env.MONGO_URI) {
            return res.status(400).json({ message: 'Databas krävs för att synka standardmenyn.' });
        }

        const result = await seedMissingDefaultMenuItems();
        if (result.insertedCount > 0) {
            broadcastMenuUpdated('sync-defaults');
        }
        return res.json({
            message: `Synk klart. Lade till ${result.insertedCount} saknade standardartiklar.`,
            insertedCount: result.insertedCount,
            totalDefaults: result.totalDefaults
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 3. Add Menu Item (Admin only)
app.post('/api/menu', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { category, categoryIcon, categoryImage, categoryPrice, name, price } = req.body;
        let imagePath = null;
        if (req.file) {
            imagePath = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        const normalizedCategory = String(category || '').trim();
        const existingCategoryItem = await MenuItem.findOne({ category: new RegExp(`^${normalizedCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
        const highestOrder = await MenuItem.findOne({ category: normalizedCategory }).sort({ sortOrder: -1 }).lean();
        const highestCategoryOrder = await MenuItem.findOne({}).sort({ categoryOrder: -1 }).lean();
        const nextSortOrder = highestOrder ? (Number(highestOrder.sortOrder) + 1) : 0;
        const nextCategoryOrder = existingCategoryItem ? Number(existingCategoryItem.categoryOrder || 999) : Number((highestCategoryOrder?.categoryOrder ?? -1) + 1);

        const newItem = new MenuItem({
            category: normalizedCategory,
            categoryIcon: categoryIcon || existingCategoryItem?.categoryIcon || '🍽️',
            categoryImage: categoryImage || existingCategoryItem?.categoryImage || null,
            categoryPrice: categoryPrice || existingCategoryItem?.categoryPrice || `Från ${price}`,
            name,
            price,
            image: imagePath,
            sortOrder: nextSortOrder,
            categoryOrder: nextCategoryOrder
        });

        await newItem.save();

        if (categoryImage || categoryPrice || categoryIcon) {
            const updateCategoryFields = {};
            if (categoryIcon) updateCategoryFields.categoryIcon = categoryIcon;
            if (categoryImage) updateCategoryFields.categoryImage = categoryImage;
            if (categoryPrice) updateCategoryFields.categoryPrice = categoryPrice;
            if (Object.keys(updateCategoryFields).length > 0) {
                await MenuItem.updateMany({ category: newItem.category }, { $set: updateCategoryFields });
            }
        }

        broadcastMenuUpdated('created');

        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Update Menu Item (Admin only)
app.put('/api/menu/:id', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { category, categoryIcon, categoryImage, categoryPrice, name, price } = req.body;
        const currentItem = await MenuItem.findById(req.params.id);
        const normalizedCategory = String(category || '').trim();
        let categoryOrder = currentItem?.categoryOrder ?? 999;
        let sortOrder = currentItem?.sortOrder ?? 0;

        if (currentItem && normalizedCategory && normalizedCategory !== currentItem.category) {
            const targetCategoryItem = await MenuItem.findOne({ category: new RegExp(`^${normalizedCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
            const maxTargetSort = await MenuItem.findOne({ category: normalizedCategory }).sort({ sortOrder: -1 }).lean();
            const highestCategoryOrder = await MenuItem.findOne({}).sort({ categoryOrder: -1 }).lean();
            categoryOrder = targetCategoryItem ? Number(targetCategoryItem.categoryOrder || 999) : Number((highestCategoryOrder?.categoryOrder ?? -1) + 1);
            sortOrder = maxTargetSort ? Number(maxTargetSort.sortOrder) + 1 : 0;
        }

        const updateData = { category: normalizedCategory, categoryIcon, categoryImage, categoryPrice, name, price, categoryOrder, sortOrder };
        if (req.file) {
            updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (updatedItem && (categoryIcon || categoryImage || categoryPrice)) {
            const updateCategoryFields = {};
            if (categoryIcon) updateCategoryFields.categoryIcon = categoryIcon;
            if (categoryImage) updateCategoryFields.categoryImage = categoryImage;
            if (categoryPrice) updateCategoryFields.categoryPrice = categoryPrice;
            if (Object.keys(updateCategoryFields).length > 0) {
                await MenuItem.updateMany({ category: updatedItem.category }, { $set: updateCategoryFields });
            }
        }

        broadcastMenuUpdated('updated');

        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/menu/reorder-category', verifyAdmin, async (req, res) => {
    try {
        const { category, itemIds } = req.body;
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ message: 'itemIds krävs' });
        }

        const updates = itemIds.map((id, index) => (
            MenuItem.updateOne({ _id: id }, { $set: { sortOrder: index } })
        ));
        await Promise.all(updates);
        broadcastMenuUpdated('reordered');
        return res.json({ message: 'Ordning uppdaterad' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Backward-compatible alias
app.post('/api/menu/reorder', verifyAdmin, async (req, res) => {
    try {
        const { itemIds } = req.body;
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ message: 'itemIds krävs' });
        }

        const updates = itemIds.map((id, index) => (
            MenuItem.updateOne({ _id: id }, { $set: { sortOrder: index } })
        ));
        await Promise.all(updates);
        broadcastMenuUpdated('reordered');
        return res.json({ message: 'Ordning uppdaterad' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/menu/reorder-categories', verifyAdmin, async (req, res) => {
    try {
        const { categories } = req.body;
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ message: 'categories krävs' });
        }

        const updates = categories.map((category, index) => (
            MenuItem.updateMany({ category }, { $set: { categoryOrder: index } })
        ));
        await Promise.all(updates);
        broadcastMenuUpdated('categories-reordered');
        return res.json({ message: 'Kategoriordning uppdaterad' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 5. Delete Menu Item (Admin only)
app.delete('/api/menu/:id', verifyAdmin, async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        broadcastMenuUpdated('deleted');
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
