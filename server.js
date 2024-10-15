require('dotenv').config(); 
const express = require('express');
const { ethers } = require('ethers');  // Correct import for ethers v6.x

// Initialize Express
const app = express();
const port = 3000;

// Ethers.js provider (connect to Ethereum network using Infura)
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

app.get('/api/latest-block', async (req, res) => {
    try {
        const block = await provider.getBlock('latest');
        res.json({
            success: true,
            data: block,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching latest block',
            error: error.message,
        });
    }
});

// API route to search for a transaction by hash
app.get('/api/transaction/:hash', async (req, res) => {
    const txHash = req.params.hash;

    try {
        const tx = await provider.getTransaction(txHash);

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
