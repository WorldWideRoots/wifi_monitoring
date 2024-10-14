
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Utility Functions to Read Data from Files
function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, jsonString) => {
      if (err) {
        reject(err);
      } else {
        try {
          const data = JSON.parse(jsonString);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

// API Endpoints

// GET /api/total-devices
app.get('/api/total-devices', async (req, res) => {
  try {
    const data = await readJSONFile('data/total_devices.json');
    res.json({ totalDevices: data.totalDevices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read total devices' });
  }
});

// GET /api/device-list
app.get('/api/device-list', async (req, res) => {
  try {
    const devices = await readCSVFile('data/device_list.csv');
    res.json({ deviceList: devices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read device list' });
  }
});

// GET /api/down-devices
app.get('/api/down-devices', async (req, res) => {
  try {
    const downDevices = await readCSVFile('data/down_devices.csv');
    res.json({ downDevices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read down devices' });
  }
});

// GET /api/site-mapping
app.get('/api/site-mapping', async (req, res) => {
  try {
    const siteMapping = await readJSONFile('data/site_mapping.json');
    res.json({ siteMapping });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read site mapping' });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
