const csv = require('csv-parser');
const { Readable } = require('stream');

class CSVParser {
    parseTransactionCSV(csvContent) {
        return new Promise((resolve, reject) => {
            const results = [];
            const requiredColumns = ['Date', 'Description', 'Amount', 'Account'];
            let headerChecked = false;

            const stream = Readable.from([csvContent]);

            stream
                .pipe(csv())
                .on('headers', (headers) => {
                    // Check if all required columns exist
                    const missingColumns = requiredColumns.filter(col =>
                        !headers.some(header => header.toLowerCase() === col.toLowerCase())
                    );

                    if (missingColumns.length > 0) {
                        reject(new Error(`Required column "${missingColumns[0]}" not found`));
                        return;
                    }
                    headerChecked = true;
                })
                .on('data', (row) => {
                    if (!headerChecked) return;

                    try {
                        const transaction = {
                            date: row.Date || row.date,
                            description: (row.Description || row.description || '').trim(),
                            amount: parseFloat(row.Amount || row.amount || '0'),
                            account: row.Account || row.account,
                            category: 'uncategorized' // Default before ML processing
                        };

                        if (!transaction.date || !transaction.description) {
                            throw new Error('Invalid transaction data: missing required fields');
                        }

                        results.push(transaction);
                    } catch (error) {
                        reject(new Error(`Error parsing transaction: ${error.message}`));
                        return;
                    }
                })
                .on('end', () => {
                    if (!headerChecked) {
                        reject(new Error('Invalid CSV format: missing required columns'));
                        return;
                    }
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                });
        });
    }
}

module.exports = new CSVParser();
