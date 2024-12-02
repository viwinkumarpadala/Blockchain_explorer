require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');

const app = express();
const port = 3000;
//  0xff174eb9ce8c4d6ac7f3e3e92ea715d8a779cb065ed5030ec1992fd452969572
// Ethers.js provider for Geth node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Geth RPC URL

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
    console.error('Error fetching transaction:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message,
    });
  }
});

// API route to get the latest block
app.get('/api/block/latest', async (req, res) => {
  try {
    const latestBlock = await provider.getBlock('latest');
    res.json({
      success: true,
      data: latestBlock,
    });
  } catch (error) {
    console.error('Error fetching latest block:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest block',
      error: error.message,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Blockchain Explorer API running on http://localhost:${port}`);
});
