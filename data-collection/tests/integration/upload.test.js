const request = require('supertest');
const app = require('../../src/app');
const fs = require('fs');
const path = require('path');

jest.mock('../../src/services/queueService');

const queueService = require('../../src/services/queueService');

describe('File Upload Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock queue service to avoid actual Redis call
        queueService.publishCSVJob = jest.fn().mockResolvedValue({ jobId: 'test-job-123' });
    });

    test('should handle complete CSV upload workflow', async () => {
        // INPUT: Create test CSV content as buffer
        const testCsvContent = `Date,Description,Amount,Account
2024-01-15,"COFFEE SHOP","-5.50","Checking"
2024-01-16,"SALARY","3000.00","Checking"`;

        // EXECUTE: POST request to upload endpoint
        const response = await request(app)
            .post('/api/upload/csv')
            .attach('csvFile', Buffer.from(testCsvContent), {
                filename: 'test-transactions.csv',
                contentType: 'text/csv'
            })
            .field('userId', 'test-user-123')
            .expect(200);

        // ASSERT: Verify complete workflow
        expect(response.body).toEqual({
            success: true,
            message: 'CSV uploaded and queued for processing',
            jobId: 'test-job-123',
            transactionCount: 2,
            estimatedProcessingTime: expect.any(Number)
        });

        // Verify queue service called with correct data
        expect(queueService.publishCSVJob).toHaveBeenCalledWith({
            userId: 'test-user-123',
            fileName: 'test-transactions.csv',
            transactionCount: 2,
            transactions: expect.arrayContaining([
                expect.objectContaining({
                    description: 'COFFEE SHOP',
                    amount: -5.50
                }),
                expect.objectContaining({
                    description: 'SALARY',
                    amount: 3000.00
                })
            ])
        });
    });

    test('should reject invalid file types', async () => {
        // INPUT: Non-CSV file (simulate PDF upload)
        const invalidFile = Buffer.from('Not a CSV file');

        // EXPECTED OUTPUT: 400 error with descriptive message
        const response = await request(app)
            .post('/api/upload/csv')
            .attach('csvFile', invalidFile, 'document.txt')
            .field('userId', 'test-user-123')
            .expect(400);

        expect(response.body).toEqual({
            success: false,
            error: 'Invalid file type. Please upload a CSV file.',
            code: 'INVALID_FILE_TYPE'
        });

        expect(queueService.publishCSVJob).not.toHaveBeenCalled();
    });

    test('should require userId in request', async () => {
        // INPUT: Valid CSV but missing userId
        const testCsvContent = `Date,Description,Amount,Account
2024-01-15,"TEST","-10.00","Checking"`;

        // EXPECTED OUTPUT: 400 error for missing userId
        const response = await request(app)
            .post('/api/upload/csv')
            .attach('csvFile', Buffer.from(testCsvContent), {
                filename: 'test.csv',
                contentType: 'text/csv'
            })
            .expect(400);

        expect(response.body).toEqual({
            success: false,
            error: 'User ID is required',
            code: 'MISSING_USER_ID'
        });
    });

    test('should require file in request', async () => {
        // INPUT: Request without file attachment
        // EXPECTED OUTPUT: 400 error for missing file
        const response = await request(app)
            .post('/api/upload/csv')
            .field('userId', 'test-user-123')
            .expect(400);

        expect(response.body).toEqual({
            success: false,
            error: 'No CSV file uploaded',
            code: 'NO_FILE'
        });
    });

    test('should handle CSV parsing errors', async () => {
        // INPUT: Invalid CSV format
        const invalidCsvContent = `Invalid,Headers
Missing required columns`;

        // EXPECTED OUTPUT: 500 error with parsing error
        const response = await request(app)
            .post('/api/upload/csv')
            .attach('csvFile', Buffer.from(invalidCsvContent), {
                filename: 'invalid.csv',
                contentType: 'text/csv'
            })
            .field('userId', 'test-user-123')
            .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('PROCESSING_ERROR');
        expect(response.body.error).toContain('Required column');
    });
});
