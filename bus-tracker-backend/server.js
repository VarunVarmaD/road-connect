const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json()); // Allows backend to understand JSON data

// --- CONNECT TO MONGODB ---
// Replace with your own connection string from MongoDB Atlas!
const dbURI = process.env.DB_URI;
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('DB connection error:', err));

// --- DEFINE THE DATA STRUCTURE (SCHEMA) ---
const StopSchema = new mongoose.Schema({
    name: String,
    location: {
        lat: Number,
        lng: Number
    }
});

const RouteSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contributions: { type: Number, default: 1 },
    stops: [StopSchema] // An array of stops
});

const Route = mongoose.model('Route', RouteSchema);

// --- API ENDPOINTS ---

// GET: Fetch all saved routes
app.get('/api/routes', async (req, res) => {
    try {
        const routes = await Route.find();
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Save a new contributed route
app.post('/api/routes', async (req, res) => {
    // For a prototype, we'll give it a generic name and create two stops (start and end)
    const routeData = {
        name: `User Route #${Math.floor(Math.random() * 1000)}`,
        stops: [
            { name: "Start", location: req.body.path[0] }, // First point
            { name: "End", location: req.body.path[req.body.path.length - 1] } // Last point
        ]
        // In a real app, you'd process the full path
    };

    const route = new Route(routeData);
    try {
        const newRoute = await route.save();
        res.status(201).json(newRoute);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));