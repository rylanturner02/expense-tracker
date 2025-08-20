const express = require('express');
const databaseService = require('../services/databaseService');

const router = express.Router();

// GET /api/market-data/symbols - list available symbols
router.get('/symbols', async (req, res) => {
    try {
        const symbols = await databaseService.getAvailableSymbols();
        res.json({
            success: true,
            data: symbols
        });
    } catch (error) {
        console.error('Error fetching symbols:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available symbols'
        });
    }
});

// GET /api/market-data/:symbol - get data for specific symbol
router.get('/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const data = await databaseService.getLatestMarketData(symbol, limit);

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No data found for symbol: ${symbol}`
            });
        }

        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            data: data
        });
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market data'
        });
    }
});

module.exports = router;
