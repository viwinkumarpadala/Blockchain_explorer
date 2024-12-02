require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios');

const app = express();
const port = 3000;

// Ethers.js provider (connect to Ethereum Execution Layer using Infura)
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

// Fetch the most recent block from the execution layer
const getBlockData = async () => {
  try {
    const block = await provider.getBlock('latest'); // Fetch block with transaction data
    return block;
  } catch (error) {
    console.error('Error fetching latest block:', error.message);
    throw error;
  }
};

// Fetch the most recent epoch data from the beacon chain
const getBeaconChainData = async () => {
  try {
    const beaconApiUrl = 'https://beaconcha.in/api/v1/epoch/latest'; // Beacon chain API for latest epoch
    const response = await axios.get(beaconApiUrl);
    if (response.data && response.data.data) {
      const { epoch, ts, eligibleether, votedether } = response.data.data;
      return { epoch, time: ts, eligibleEther: eligibleether, votedEther: votedether };
    }
    throw new Error('Failed to fetch latest epoch data.');
  } catch (error) {
    console.error('Error fetching epoch data:', error.message);
    throw error;
  }
};

// Fetch the most recent slots data for the given epoch
const getSlotsData = async (epoch) => {
  try {
    const slotsApiUrl = `https://beaconcha.in/api/v1/epoch/${epoch}/slots`; // Beacon chain API for slots of specific epoch
    const response = await axios.get(slotsApiUrl);
    if (response.data && response.data.data) {
      return response.data.data; // Return slot details
    }
    throw new Error('Failed to fetch slots data.');
  } catch (error) {
    console.error('Error fetching slots data:', error.message);
    throw error;
  }
};

// Endpoint to fetch latest block, epoch, and slot details
app.get('/api/latest-block-and-epoch', async (req, res) => {
  try {
    // Fetch latest block from execution layer
    const block = await getBlockData();
    console.log('Latest Block:', block);

    // Fetch latest epoch from beacon chain
    const beaconData = await getBeaconChainData();
    console.log('Beacon Chain Data:', beaconData);

    // Fetch slots for the most recent epoch
    const slotsData = await getSlotsData(beaconData.epoch);
    console.log('Slots Data:', slotsData);

    // Format the block data
    const blockDetails = {
      _type: "Block",
      baseFeePerGas: block.baseFeePerGas ? block.baseFeePerGas.toString() : null,
      difficulty: block.difficulty.toString(),
      extraData: block.extraData,
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      blobGasUsed: block.blobGasUsed ? block.blobGasUsed.toString() : null,
      excessBlobGas: block.excessBlobGas ? block.excessBlobGas.toString() : null,
      hash: block.hash,
      miner: block.miner,
      prevRandao: block.prevRandao ? block.prevRandao : null,
      nonce: block.nonce,
      number: block.number,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      parentBeaconBlockRoot: block.parentBeaconBlockRoot ? block.parentBeaconBlockRoot : null,
      stateRoot: block.stateRoot,
      receiptsRoot: block.receiptsRoot,
      transactions: block.transactions // Only return transaction hashes
    };

    // Return data in response
    res.json({
      success: true,
      data: {
        epoch: {
          epoch: beaconData.epoch,
          time: beaconData.time,
          eligibleEther: beaconData.eligibleEther,
          votedEther: beaconData.votedEther
        },
        block: blockDetails,
        slots: slotsData // Include slots data
      }
    });
  } catch (error) {
    console.error('Error in /api/latest-block-and-epoch:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest block, epoch, or slots data',
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
    console.error('Error fetching transaction:', error.message);
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
