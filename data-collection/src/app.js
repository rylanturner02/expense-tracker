const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const uploadController = require('./controllers/uploadController');
const marketDataController = require('./controllers/marketDataController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadController);
app.use('/api/market-data', marketDataController);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'data-collection' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Data Collection Service running on port ${PORT}`);
    });
}

module.exports = app;
