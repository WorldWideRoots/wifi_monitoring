// src/utils/dataProcessing.js

/**
 * Calculates the latest DOWN timestamp for each site.
 * @param {Array} downDevices - Array of down device objects.
 * @param {string} key - The key to extract the site code from (e.g., 'nwDeviceName').
 * @returns {Object} An object mapping site codes to their latest DOWN timestamp.
 */
export const calculateLatestDownTimestamp = (downDevices, key = 'nwDeviceName') => {
    const latestTimestamps = {};
  
    downDevices.forEach((device) => {
      const siteCode = device[key].substring(0, 5).toUpperCase();
      const timestamp = parseInt(device.timestamp, 10);
  
      if (!isNaN(timestamp)) {
        if (!latestTimestamps[siteCode] || timestamp > latestTimestamps[siteCode]) {
          latestTimestamps[siteCode] = timestamp;
        }
      }
    });
  
    return latestTimestamps;
  };
  
  /**
   * Calculates device counts per site based on a specific key.
   * @param {Array} deviceList - Array of device objects.
   * @param {string} key - The key to extract the site code from (e.g., 'hostname').
   * @returns {Object} An object mapping site codes to device counts.
   */
  export const calculateDeviceCounts = (deviceList, key = 'hostname') => {
    const counts = {};
    deviceList.forEach((device) => {
      const name = device[key];
      if (name) {
        const siteCode = name.substring(0, 5).toUpperCase();
        counts[siteCode] = (counts[siteCode] || 0) + 1;
      }
    });
    return counts;
  };

  
  // src/components/SiteList.js

import React, { useEffect, useState } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Container,
  Grid,
} from '@material-ui/core';
import { getSiteMapping, getDeviceList, getCurrentDownDevices, getDownDevices } from '../services/deviceService';
import { calculateDeviceCounts, calculateLatestDownTimestamp } from '../utils/dataProcessing';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
  progressBar: {
    marginTop: 5,
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
}));

function SiteList() {
  const classes = useStyles();
  const [sites, setSites] = useState({});
  const [deviceCounts, setDeviceCounts] = useState({});
  const [downDeviceCounts, setDownDeviceCounts] = useState({});
  const [latestDownTimestamps, setLatestDownTimestamps] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('siteName');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const siteMapping = await getSiteMapping();
        const deviceList = await getDeviceList();
        const currentDownDevices = await getCurrentDownDevices();
        const downDevices = await getDownDevices();

        const totalDeviceCounts = calculateDeviceCounts(deviceList, 'hostname');
        setDeviceCounts(totalDeviceCounts);

        const downCounts = calculateDeviceCounts(currentDownDevices, 'nwDeviceName');
        setDownDeviceCounts(downCounts);

        const latestTimestamps = calculateLatestDownTimestamp(currentDownDevices, 'nwDeviceName');
        setLatestDownTimestamps(latestTimestamps);

        setSites(siteMapping);
      } catch (error) {
        console.error('Error fetching site data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const filteredSites = Object.entries(sites)
    .filter(([siteCode, siteName]) => {
      const searchValue = searchTerm.toLowerCase();
      const matchesSearch =
        siteName.toLowerCase().includes(searchValue) ||
        siteCode.toLowerCase().includes(searchValue);
      const totalDevices = deviceCounts[siteCode] || 0;
      return matchesSearch && totalDevices > 0; // Exclude sites with 0 devices
    })
    .sort((a, b) => {
      const [codeA, nameA] = a;
      const [codeB, nameB] = b;

      if (sortOption === 'siteName') {
        return nameA.localeCompare(nameB);
      } else if (sortOption === 'devicesUp') {
        const upA = (deviceCounts[codeA] || 0) - (downDeviceCounts[codeA] || 0);
        const upB = (deviceCounts[codeB] || 0) - (downDeviceCounts[codeB] || 0);
        return upB - upA;
      } else if (sortOption === 'devicesDown') {
        return (downDeviceCounts[codeB] || 0) - (downDeviceCounts[codeA] || 0);
      } else if (sortOption === 'latestDown') {
        const latestA = latestDownTimestamps[codeA] || 0;
        const latestB = latestDownTimestamps[codeB] || 0;
        return latestB - latestA;
      }
      return 0;
    });

  const getBadgeColor = (percentage) => {
    if (percentage >= 90) return 'primary';
    if (percentage >= 70) return 'default';
    return 'secondary';
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container style={{ padding: 20, backgroundColor: '#2e2e2e', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom style={{ color: '#ffffff' }}>
        Sites
      </Typography>
      <Grid container spacing={3} alignItems="flex-end">
        <Grid item xs={12} sm={6}>
          <TextField
            label="Search Sites"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: '#ffffff' } }}
            InputProps={{ style: { color: '#ffffff' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel style={{ color: '#ffffff' }}>Sort By</InputLabel>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label="Sort By"
              style={{ color: '#ffffff' }}
            >
              <MenuItem value="siteName">Site Name</MenuItem>
              <MenuItem value="devicesUp">Devices Up</MenuItem>
              <MenuItem value="devicesDown">Devices Down</MenuItem>
              <MenuItem value="latestDown">Latest DOWN Device</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <List>
        {filteredSites.map(([siteCode, siteName]) => {
          const totalDevices = deviceCounts[siteCode] || 0;
          const downDevices = downDeviceCounts[siteCode] || 0;
          const upDevices = totalDevices - downDevices;
          const upPercentage = totalDevices > 0 ? (upDevices / totalDevices) * 100 : 0;
          const latestDownTimestamp = latestDownTimestamps[siteCode] || null;
          const latestDownDate = latestDownTimestamp ? new Date(latestDownTimestamp) : null;

          return (
            <ListItem
              button
              key={siteCode}
              component={Link}
              to={`/sites/${siteCode}`}
              className={classes.listItem}
            >
              <ListItemText
                primary={
                  <>
                    {siteName}
                    <Chip
                      label={`${upPercentage.toFixed(1)}% UP`}
                      color={getBadgeColor(upPercentage)}
                      className={classes.chip}
                    />
                  </>
                }
                secondary={
                  <>
                    {`${upDevices} UP / ${totalDevices} devices`}
                    {sortOption === 'latestDown' && latestDownDate && (
                      <Typography variant="body2" style={{ marginTop: 4, color: '#b0bec5' }}>
                        Latest DOWN: {latestDownDate.toLocaleString()}
                      </Typography>
                    )}
                    <LinearProgress
                      variant="determinate"
                      value={upPercentage}
                      className={classes.progressBar}
                      color="primary"
                    />
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
}

export default SiteList;


// backend/index.js

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
    const data = await readJSONFile('data/device_count.json');
    res.json({ totalDevices: data.device_count, timestamp: data.timestamp });
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
    const downDevices = await readJSONFile('data/down_devices.json');
    // Convert all MAC addresses to uppercase to ensure consistency
    const uppercasedDownDevices = {};
    for (const [mac, timestamp] of Object.entries(downDevices)) {
      uppercasedDownDevices[mac.toUpperCase()] = timestamp;
    }
    res.json(uppercasedDownDevices); // Return the downDevices dictionary directly
  } catch (error) {
    res.status(500).json({ error: 'Failed to read down devices' });
  }
});

// GET /api/site-mapping
app.get('/api/site-mapping', async (req, res) => {
  try {
    const siteMapping = await readJSONFile('data/site_code_map.json');
    res.json({ siteMapping });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read site mapping' });
  }
});

// GET /api/current-down-device-info
app.get('/api/current-down-device-info', async (req, res) => {
  try {
    const downDeviceInfo = await readCSVFile('data/current_down_device_info.csv');
    // Ensure MAC addresses are uppercase
    const uppercasedDownDeviceInfo = downDeviceInfo.map((device) => ({
      ...device,
      macAddress: device.macAddress.toUpperCase(),
    }));
    res.json({ downDevices: uppercasedDownDeviceInfo }); // Ensure consistency in key naming
  } catch (error) {
    res.status(500).json({ error: 'Failed to read current down device info' });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
