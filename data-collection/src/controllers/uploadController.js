const express = require('express');
const multer = require('multer');
const csvParser = require('../services/csvParser');
const queueService = require('../services/queueService');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a CSV file.'));
        }
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            error: err.message,
            code: 'UPLOAD_ERROR'
        });
    } else if (err && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            error: err.message,
            code: 'INVALID_FILE_TYPE'
        });
    }
    next(err);
};

router.post('/csv', upload.single('csvFile'), handleMulterError, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
                code: 'MISSING_USER_ID'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No CSV file uploaded',
                code: 'NO_FILE'
            });
        }

        const csvContent = req.file.buffer.toString('utf8');
        const transactions = await csvParser.parseTransactionCSV(csvContent);

        const jobData = {
            userId,
            fileName: req.file.originalname,
            transactionCount: transactions.length,
            transactions
        };

        const { jobId } = await queueService.publishCSVJob(jobData);

        const estimatedProcessingTime = Math.ceil(transactions.length / 100);

        res.json({
            success: true,
            message: 'CSV uploaded and queued for processing',
            jobId,
            transactionCount: transactions.length,
            estimatedProcessingTime
        });

    } catch (error) {
        console.error('Upload error:', error);

        res.status(500).json({
            success: false,
            error: error.message,
            code: 'PROCESSING_ERROR'
        });
    }
});

module.exports = router;
