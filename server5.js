require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios'); // For Beacon API requests

const app = express();
const port = 3000;

// Ethers.js provider for Geth node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Geth RPC URL

// Beacon API endpoint for querying epoch and slot information
const BEACON_API_URL = 'http://127.0.0.1:3500';

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

// API route to get epoch, slot, and progress information
app.get('/api/epoch-info', async (req, res) => {
  try {
    // Fetch the most recent slot from Beacon API
    const response = await axios.get(`${BEACON_API_URL}/eth/v1/beacon/headers`);
    const { data } = response;

    // Extract most recent slot
    const currentSlot = parseInt(data.data[0].header.message.slot, 10);
    const slotsPerEpoch = 32; // Default value for Ethereum 2.0

    // Calculate current epoch and progress
    const currentEpoch = Math.floor(currentSlot / slotsPerEpoch);
    const slotInEpoch = currentSlot % slotsPerEpoch;
    const epochProgress = ((slotInEpoch + 1) / slotsPerEpoch) * 100;

    res.json({
      success: true,
      data: {
        currentEpoch,
        currentSlot,
        epochProgress: epochProgress.toFixed(2), // Percentage progress
      },
    });
  } catch (error) {
    console.error('Error fetching epoch information:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching epoch information',
      error: error.message,
    });
  }
});

// API route to get the most recent epochs
app.get('/api/epochs', async (req, res) => {
    try {
      const response = await axios.get(`${BEACON_API_URL}/eth/v1/beacon/states/head/epochs`);
      const { data } = response;
  
      // Extract the most recent 5 epochs (for example)
      const recentEpochs = data.data.slice(0, 5).map(epoch => {
        const epochNumber = epoch.epoch;
        const eligibleETH = epoch.eligible_eth;
        const votedETH = epoch.voted_eth;
        const finalized = epoch.finalized ? 'Yes' : 'No';
        const timeAgo = `${Math.floor(epoch.time_since_last_epoch / 60)} mins ago`;
  
        return {
          epoch: epochNumber,
          time: timeAgo,
          finalized,
          eligible: eligibleETH,
          voted: votedETH
        };
      });
  
      res.json({
        success: true,
        data: recentEpochs,
      });
    } catch (error) {
      console.error('Error fetching epoch information:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error fetching epoch information',
        error: error.message,
      });
    }
  });
  
  // API route to get the most recent blocks
  app.get('/api/blocks', async (req, res) => {
    try {
      const response = await axios.get(`${BEACON_API_URL}/eth/v1/beacon/headers`);
      const { data } = response;
      
  
      // Extract the most recent 5 blocks (for example)
      const recentBlocks = data.data.slice(0, 5).map(block => {
        console.log(block)
        const epoch = Math.floor(block.header.message.slot / 32);  // Calculate epoch from slot
        const slot = block.header.message.slot;
        const blockNumber = block.header.message.body_root;
        const status = block.canonical ? 'Proposed' : 'Not Proposed';
        const proposer = block.header.message.proposer_index;
  
        // Check for timestamp and ensure it's properly formatted
        const timestamp = block.timestamp;
        const timeAgo = timestamp
          ? `${Math.floor((Date.now() - timestamp * 1000) / 1000 / 60)} mins ago`
          : 'Unknown time';
  
        return {
          epoch,
          slot,
          block: blockNumber,
          status,
          time: timeAgo,
          proposer
        };
      });
  
      res.json({
        success: true,
        data: recentBlocks,
      });
    } catch (error) {
      console.error('Error fetching block information:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error fetching block information',
        error: error.message,
      });
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Blockchain Explorer API running on http://localhost:${port}`);
});
