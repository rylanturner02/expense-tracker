const { pool } = require('../config/database');

class DatabaseService {
    async insertMarketData(marketDataArray) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let insertedCount = 0;
            let duplicateCount = 0;

            for (const data of marketDataArray) {
                try {
                    const insertQuery = `
            INSERT INTO market_data (symbol, date, open_price, high_price, low_price, close_price, volume, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (symbol, date, data_source) DO NOTHING
            RETURNING id
          `;

                    const values = [
                        data.symbol,
                        data.date,
                        data.open_price,
                        data.high_price,
                        data.low_price,
                        data.close_price,
                        data.volume,
                        data.data_source
                    ];

                    const result = await client.query(insertQuery, values);

                    if (result.rows.length > 0) {
                        insertedCount++;
                    } else {
                        duplicateCount++;
                    }

                } catch (error) {
                    console.error(`Error inserting market data for ${data.symbol} on ${data.date}:`, error.message);
                }
            }

            await client.query('COMMIT');
            console.log(`Inserted ${insertedCount} new records, skipped ${duplicateCount} duplicates`);

            return { inserted: insertedCount, duplicates: duplicateCount };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async insertEconomicData(economicDataArray) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let insertedCount = 0;

            for (const data of economicDataArray) {
                try {
                    const insertQuery = `
            INSERT INTO economic_indicators (indicator_name, date, value, unit, data_source)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (indicator_name, date, data_source) DO NOTHING
            RETURNING id
          `;

                    const values = [
                        data.indicator_name,
                        data.date,
                        data.value,
                        data.unit,
                        data.data_source
                    ];

                    const result = await client.query(insertQuery, values);

                    if (result.rows.length > 0) {
                        insertedCount++;
                    }

                } catch (error) {
                    console.error(`Error inserting economic data:`, error.message);
                }
            }

            await client.query('COMMIT');
            console.log(`Inserted ${insertedCount} economic indicator records`);

            return { inserted: insertedCount };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getLatestMarketData(symbol, limit = 10) {
        try {
            const query = `
        SELECT * FROM market_data 
        WHERE symbol = $1 
        ORDER BY date DESC 
        LIMIT $2
      `;

            const result = await pool.query(query, [symbol.toUpperCase(), limit]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching market data:', error);
            throw error;
        }
    }

    async getAvailableSymbols() {
        try {
            const query = `
        SELECT DISTINCT symbol, COUNT(*) as data_points, MAX(date) as latest_date
        FROM market_data 
        GROUP BY symbol 
        ORDER BY symbol
      `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching available symbols:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
