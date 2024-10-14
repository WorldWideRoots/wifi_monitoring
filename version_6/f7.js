// src/components/SiteDetails.js

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useParams } from 'react-router-dom';
import {
  getDeviceList,
  getCurrentDownDevices,
  getSiteMapping,
  getDownDevices,
} from '../services/deviceService';
import DeviceStatusChart from './DeviceStatusChart';
import { ExpandMore, ExpandLess, Warning } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: 20,
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
  },
  table: {
    minWidth: 650,
  },
  tableRow: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
  selectedRow: {
    backgroundColor: theme.palette.action.selected,
  },
  deviceInfo: {
    paddingLeft: theme.spacing(4),
    paddingBottom: theme.spacing(2),
  },
  icon: {
    verticalAlign: 'middle',
    marginRight: theme.spacing(1),
    color: theme.palette.secondary.main,
  },
}));

function SiteDetails() {
  const classes = useStyles();
  const { siteId } = useParams();
  const [siteName, setSiteName] = useState('');
  const [devices, setDevices] = useState([]);
  const [downDevicesInfo, setDownDevicesInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const siteMapping = await getSiteMapping();
        setSiteName(siteMapping[siteId] || siteId);

        const deviceList = await getDeviceList();
        const currentDownDevices = (await getCurrentDownDevices()) || [];
        const downDevicesJson = await getDownDevices();

        // Normalize MAC addresses to uppercase for consistent lookup
        const downDevicesTimestamps = {};
        for (const [mac, timestamp] of Object.entries(downDevicesJson)) {
          downDevicesTimestamps[mac.toUpperCase()] = timestamp;
        }

        // Filter devices for the current site
        const filteredDevices = deviceList.filter((device) => {
          const hostname = device.hostname || '';
          const siteCode = hostname.substring(0, 5).toUpperCase();
          return siteCode === siteId.toUpperCase();
        });
        setDevices(filteredDevices);

        // Filter down devices for the current site
        const filteredDownDevices = currentDownDevices.filter((device) => {
          const nwDeviceName = device.nwDeviceName || '';
          const siteCode = nwDeviceName.substring(0, 5).toUpperCase();
          return siteCode === siteId.toUpperCase();
        });

        // Map down devices info with additional data
        const downDevicesInfo = filteredDownDevices.map((device) => {
          const macAddress = device.macAddress.toUpperCase(); // Normalize to uppercase
          const downSinceEpoch = downDevicesTimestamps[macAddress];
          const downSinceDate = downSinceEpoch ? new Date(downSinceEpoch) : null;
          const lastUpdatedEpoch = parseInt(device.timestamp, 10);
          const lastUpdatedDate = !isNaN(lastUpdatedEpoch)
            ? new Date(lastUpdatedEpoch)
            : null;
          return {
            ...device,
            downSinceEpoch,
            downSinceDate,
            lastUpdatedEpoch,
            lastUpdatedDate,
          };
        });

        setDownDevicesInfo(downDevicesInfo);
      } catch (error) {
        console.error('Error fetching site details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [siteId]);

  const handleRowClick = (macAddress) => {
    setExpandedDeviceId((prev) => (prev === macAddress ? null : macAddress));
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  const totalDevicesCount = devices.length;
  const downDevicesCount = downDevicesInfo.length;
  const upDevicesCount = totalDevicesCount - downDevicesCount;

  return (
    <Container className={classes.container}>
      <Typography variant="h4" gutterBottom>
        Site Details - {siteName || siteId}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Devices</Typography>
              <Typography variant="h4">{totalDevicesCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card style={{ color: 'green' }}>
            <CardContent>
              <Typography variant="h6">Devices Up</Typography>
              <Typography variant="h4">{upDevicesCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card style={{ color: 'red' }}>
            <CardContent>
              <Typography variant="h6">Devices Down</Typography>
              <Typography variant="h4">{downDevicesCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <DeviceStatusChart
            upDevices={upDevicesCount}
            downDevices={downDevicesCount}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom style={{ marginTop: 20 }}>
        Devices Down
      </Typography>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="down devices table">
          <TableHead>
            <TableRow>
              <TableCell>Device Name</TableCell>
              <TableCell>Down Since</TableCell>
              <TableCell align="right">Last Updated</TableCell>
              <TableCell align="right">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {downDevicesInfo.map((device) => {
              const isExpanded = expandedDeviceId === device.macAddress;
              return (
                <React.Fragment key={device.macAddress}>
                  <TableRow
                    className={`${classes.tableRow} ${
                      isExpanded ? classes.selectedRow : ''
                    }`}
                    hover
                  >
                    <TableCell component="th" scope="row">
                      <Warning className={classes.icon} />
                      {device.nwDeviceName}
                    </TableCell>
                    <TableCell>
                      {device.downSinceDate
                        ? device.downSinceDate.toLocaleString()
                        : 'Unknown'}
                    </TableCell>
                    <TableCell align="right">
                      {device.lastUpdatedDate
                        ? device.lastUpdatedDate.toLocaleString()
                        : 'Unknown'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleRowClick(device.macAddress)}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <div className={classes.deviceInfo}>
                          <Typography variant="body2">
                            <strong>MAC Address:</strong> {device.macAddress}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Location:</strong> {device.location}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Last Updated:</strong>{' '}
                            {device.lastUpdatedDate
                              ? device.lastUpdatedDate.toLocaleString()
                              : 'Unknown'}
                          </Typography>
                        </div>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default SiteDetails;


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
    res.json(downDevices); // Return the downDevices dictionary directly
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
    res.json({ downDevices: downDeviceInfo }); // Ensure consistency in key naming
  } catch (error) {
    res.status(500).json({ error: 'Failed to read current down device info' });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
