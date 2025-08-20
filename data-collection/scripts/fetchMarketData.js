const marketDataService = require('../src/services/marketDataService');
const databaseService = require('../src/services/databaseService');

const SYMBOLS_TO_FETCH = [
    'AAPL',
    'GOOGL',
    'MSFT',
    'TSLA',
    'SPY'
];

async function fetchAndStoreMarketData() {
    console.log('Starting market data fetch and store process...');

    try {
        let totalInserted = 0;
        let totalDuplicates = 0;

        for (const symbol of SYMBOLS_TO_FETCH) {
            try {
                console.log(`\nProcessing ${symbol}...`);

                const marketData = await marketDataService.fetchDailyStockData(symbol);

                if (marketData.length === 0) {
                    console.log(`No data received for ${symbol}`);
                    continue;
                }

                const result = await databaseService.insertMarketData(marketData);
                totalInserted += result.inserted;
                totalDuplicates += result.duplicates;

                if (SYMBOLS_TO_FETCH.indexOf(symbol) < SYMBOLS_TO_FETCH.length - 1) {
                    console.log('⏱Waiting 12 seconds for rate limit...');
                    await marketDataService.delay();
                }

            } catch (error) {
                console.error(`Error processing ${symbol}:`, error.message);
                // Continue with next symbol instead of failing entire process
            }
        }

        console.log('\nMarket data fetch completed!');
        console.log(`${totalInserted} new records inserted, ${totalDuplicates} duplicates skipped`);

        const availableSymbols = await databaseService.getAvailableSymbols();
        console.log('\nAvailable symbols in database:');
        availableSymbols.forEach(symbol => {
            console.log(`   ${symbol.symbol}: ${symbol.data_points} data points (latest: ${symbol.latest_date})`);
        });

    } catch (error) {
        console.error('Fatal error in market data fetch:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

fetchAndStoreMarketData();
