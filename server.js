const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB setup
mongoose.connect('mongodb://localhost/nice_slice', { useNewUrlParser: true, useUnifiedTopology: true });

const PizzeriaSchema = new mongoose.Schema({
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    rating: Number,
    reviews: Number,
    photos: [String],
    signaturePizza: String,
    priceRange: String,
    tagline: String,
    story: String,
    hours: String,
    contact: String
});
const Pizzeria = mongoose.model('Pizzeria', PizzeriaSchema);

// List of large chains to exclude
const largeChains = [
    "Domino's", "Pizza Hut", "Papa John's", "Little Caesars",
    "Sbarro", "California Pizza Kitchen", "Papa Murphy's",
    "CiCi's Pizza", "Chuck E. Cheese", "Marco's Pizza"
];

// Geocode location using Nominatim (OSM's geocoding service)
async function geocodeLocation(location) {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
        if (response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon)
            };
        }
        throw new Error('Location not found');
    } catch (error) {
        throw new Error('Geocoding error: ' + error.message);
    }
}

// Fetch pizzerias from Overpass API
async function fetchPizzerias(lat, lon) {
    const query = `
        [out:json];
        node["amenity"="restaurant"]["cuisine"="pizza"](around:5000,${lat},${lon});
        way["amenity"="restaurant"]["cuisine"="pizza"](around:5000,${lat},${lon});
        out body;
    `;
    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query);
        const elements = response.data.elements;

        // Filter out large chains
        const pizzerias = elements
            .filter(element => {
                const name = element.tags?.name?.toLowerCase() || '';
                return !largeChains.some(chain => name.includes(chain.toLowerCase()));
            })
            .map(element => ({
                name: element.tags?.name || 'Unknown Pizzeria',
                address: element.tags?.['addr:street'] || 'Unknown Address',
                lat: element.lat || element.center?.lat,
                lng: element.lon || element.center?.lon,
                rating: element.tags?.rating || 0,
                reviews: element.tags?.review_count || 0,
                photos: [], // OSM doesn't provide photos; use placeholders or user uploads
                signaturePizza: element.tags?.signature_pizza || 'Unknown',
                priceRange: element.tags?.price_range || 'Unknown',
                tagline: element.tags?.description || 'Fresh, local pizza!',
                story: element.tags?.story || 'A local favorite serving delicious pizzas.',
                hours: element.tags?.opening_hours || 'Unknown',
                contact: element.tags?.phone || 'Unknown'
            }));

        // Save to MongoDB
        await Pizzeria.deleteMany({}); // Clear previous data (for demo)
        await Pizzeria.insertMany(pizzerias);

        return pizzerias;
    } catch (error) {
        console.error('Error fetching pizzerias:', error);
        throw new Error('Overpass API error');
    }
}

// API endpoint to search pizzerias
app.get('/api/pizzerias', async (req, res) => {
    const { location } = req.query;
    if (!location) {
        return res.status(400).json({ error: 'Location is required' });
    }

    try {
        const { lat, lon } = await geocodeLocation(location);
        const pizzerias = await fetchPizzerias(lat, lon);
        res.json(pizzerias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
