require('dotenv').config();
const express = require('express');
const axios = require('axios');

// Initialize Express
const app = express();
const port = 3000;

// Moralis API base URL
const MORALIS_API_URL = 'https://deep-index.moralis.io/api/v2';

// Middleware to add Moralis API Key to every request header
const moralisInstance = axios.create({
    baseURL: MORALIS_API_URL,
    headers: {
        'X-API-Key': process.env.MORALIS_API_KEY,
    },
});

// Get the latest N blocks using Moralis API
app.get('/api/latest-blocks/:count', async (req, res) => {
    const blockCount = parseInt(req.params.count) || 10; // Default to 10 blocks if no count is provided

    try {
        // Fetch the latest block (Moralis provides only single latest block details in API)
        const latestBlockResponse = await moralisInstance.get(`/block/latest`);

        const latestBlock = latestBlockResponse.data;
        const latestBlockNumber = latestBlock.number;

        // Fetch previous blocks by block number (looping backward)
        const blocks = [];
        for (let i = 0; i < blockCount; i++) {
            const blockResponse = await moralisInstance.get(`/block/${latestBlockNumber - i}`);
            blocks.push(blockResponse.data);
        }

        res.json({
            success: true,
            data: blocks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blocks',
            error: error.message,
        });
    }
});

// API route to search for a transaction by hash using Moralis
app.get('/api/transaction/:hash', async (req, res) => {
    const txHash = req.params.hash;

    try {
        const txResponse = await moralisInstance.get(`/transaction/${txHash}`);
        const tx = txResponse.data;

        if (!tx) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        res.json({
            success: true,
            data: tx,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction',
            error: error.message,
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Blockchain Explorer API running on http://localhost:${port}`);
});
