const csvParser = require('../../src/services/csvParser');

describe('CSV Parser Service - Unit Tests', () => {
    describe('parseTransactionCSV', () => {
        test('should parse valid bank CSV with standard format', async () => {
            // INPUT: Sample CSV data string
            const csvInput = `Date,Description,Amount,Account
2024-01-15,"STARBUCKS COFFEE","-4.25","Checking"
2024-01-16,"PAYROLL DEPOSIT","2500.00","Checking"
2024-01-17,"AMAZON.COM","-89.99","Credit Card"`;

            // EXPECTED OUTPUT: Parsed transaction objects
            const expectedOutput = [
                {
                    date: '2024-01-15',
                    description: 'STARBUCKS COFFEE',
                    amount: -4.25,
                    account: 'Checking',
                    category: 'uncategorized'
                },
                {
                    date: '2024-01-16',
                    description: 'PAYROLL DEPOSIT',
                    amount: 2500.00,
                    account: 'Checking',
                    category: 'uncategorized'
                },
                {
                    date: '2024-01-17',
                    description: 'AMAZON.COM',
                    amount: -89.99,
                    account: 'Credit Card',
                    category: 'uncategorized'
                }
            ];

            // EXECUTE: Parse the CSV
            const result = await csvParser.parseTransactionCSV(csvInput);

            // ASSERT: Verify output matches expected structure
            expect(result).toEqual(expectedOutput);
            expect(result).toHaveLength(3);
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('amount');
            expect(typeof result[0].amount).toBe('number');
        });

        test('should handle invalid CSV format gracefully', async () => {
            // INPUT: Malformed CSV data
            const invalidCsvInput = `Invalid,CSV,Format
"Incomplete row"
"Missing,quotes and fields`;

            // EXPECTED OUTPUT: Should throw descriptive error  
            await expect(csvParser.parseTransactionCSV(invalidCsvInput)).rejects.toThrow('Required column "Date" not found');
        });

        test('should validate required columns exist', async () => {
            // INPUT: CSV missing required 'Amount' column
            const csvMissingColumns = `Date,Description,Account
2024-01-15,"STARBUCKS COFFEE","Checking"`;

            // EXPECTED OUTPUT: Should throw validation error
            await expect(csvParser.parseTransactionCSV(csvMissingColumns)).rejects.toThrow('Required column "Amount" not found');
        });

        test('should handle empty CSV content', async () => {
            // INPUT: Empty string
            const emptyCsv = '';

            // EXPECTED OUTPUT: Should throw error for empty content
            await expect(csvParser.parseTransactionCSV(emptyCsv)).rejects.toThrow();
        });

        test('should convert string amounts to numbers', async () => {
            // INPUT: CSV with string amounts
            const csvInput = `Date,Description,Amount,Account
2024-01-15,"TEST TRANSACTION","123.45","Checking"`;

            // EXECUTE: Parse the CSV
            const result = await csvParser.parseTransactionCSV(csvInput);

            // ASSERT: Amount should be converted to number
            expect(typeof result[0].amount).toBe('number');
            expect(result[0].amount).toBe(123.45);
        });
    });
});
