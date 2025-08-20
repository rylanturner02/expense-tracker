const axios = require('axios');
require('dotenv').config();

class MarketDataService {
    constructor() {
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.rateLimitDelay = 12000;
    }

    async fetchDailyStockData(symbol) {
        try {
            console.log(`Fetching stock data for ${symbol}...`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'TIME_SERIES_DAILY',
                    symbol: symbol,
                    apikey: this.apiKey,
                    outputsize: 'compact'
                },
                timeout: 10000
            });

            if (response.data['Error Message']) {
                throw new Error(`API Error: ${response.data['Error Message']}`);
            }

            if (response.data['Note']) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }

            const timeSeries = response.data['Time Series (Daily)'];
            if (!timeSeries) {
                throw new Error('No time series data found in API response');
            }

            const stockData = [];
            for (const [date, data] of Object.entries(timeSeries)) {
                stockData.push({
                    symbol: symbol.toUpperCase(),
                    date: date,
                    open_price: parseFloat(data['1. open']),
                    high_price: parseFloat(data['2. high']),
                    low_price: parseFloat(data['3. low']),
                    close_price: parseFloat(data['4. close']),
                    volume: parseInt(data['5. volume']),
                    data_source: 'alpha_vantage'
                });
            }

            console.log(`Fetched ${stockData.length} records for ${symbol}`);
            return stockData;

        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error.message);
            throw error;
        }
    }

    async fetchEconomicIndicator(indicator) {
        try {
            console.log(`Fetching economic data for ${indicator}...`);

            const response = await axios.get(this.baseUrl, {
                params: {
                    function: indicator, // 'GDP', 'INFLATION', 'UNEMPLOYMENT'
                    apikey: this.apiKey
                },
                timeout: 10000
            });

            if (response.data['Error Message']) {
                throw new Error(`API Error: ${response.data['Error Message']}`);
            }

            // Real implementation will handle each indicator type
            const data = response.data.data || [];

            return data.map(item => ({
                indicator_name: indicator,
                date: item.date,
                value: parseFloat(item.value),
                unit: item.unit || 'percent',
                data_source: 'alpha_vantage'
            }));

        } catch (error) {
            console.error(`Error fetching economic data for ${indicator}:`, error.message);
            throw error;
        }
    }

    async delay() {
        return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
    }
}

module.exports = new MarketDataService();
