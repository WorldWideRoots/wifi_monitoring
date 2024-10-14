// src/utils/dataProcessing.js

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
import { getSiteMapping, getDeviceList, getCurrentDownDevices } from '../services/deviceService';
import { calculateDeviceCounts } from '../utils/dataProcessing';
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
  progressBar: {
    marginTop: 5,
  },
});

function SiteList() {
  const classes = useStyles();
  const [sites, setSites] = useState({});
  const [deviceCounts, setDeviceCounts] = useState({});
  const [downDeviceCounts, setDownDeviceCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('siteName');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const siteMapping = await getSiteMapping();
        const deviceList = await getDeviceList();
        const currentDownDevices = (await getCurrentDownDevices()) || [];

        const totalDeviceCounts = calculateDeviceCounts(deviceList, 'hostname');
        setDeviceCounts(totalDeviceCounts);

        const downCounts = calculateDeviceCounts(currentDownDevices, 'nwDeviceName');
        setDownDeviceCounts(downCounts);

        setSites(siteMapping);
      } catch (error) {
        console.error('Error fetching site data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const filteredSites = Object.entries(sites).filter(([siteCode, siteName]) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      siteName.toLowerCase().includes(searchValue) ||
      siteCode.toLowerCase().includes(searchValue)
    );
  });

  const sortedSites = filteredSites.sort((a, b) => {
    const [codeA, nameA] = a;
    const [codeB, nameB] = b;
    const upA = (deviceCounts[codeA] || 0) - (downDeviceCounts[codeA] || 0);
    const upB = (deviceCounts[codeB] || 0) - (downDeviceCounts[codeB] || 0);
    const downA = downDeviceCounts[codeA] || 0;
    const downB = downDeviceCounts[codeB] || 0;

    if (sortOption === 'siteName') {
      return nameA.localeCompare(nameB);
    } else if (sortOption === 'devicesUp') {
      return upB - upA;
    } else if (sortOption === 'devicesDown') {
      return downB - downA;
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
    <Container style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
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
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="siteName">Site Name</MenuItem>
              <MenuItem value="devicesUp">Devices Up</MenuItem>
              <MenuItem value="devicesDown">Devices Down</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <List>
        {sortedSites.map(([siteCode, siteName]) => {
          const totalDevices = deviceCounts[siteCode] || 0;
          const downDevices = downDeviceCounts[siteCode] || 0;
          const upDevices = totalDevices - downDevices;
          const upPercentage = totalDevices > 0 ? (upDevices / totalDevices) * 100 : 0;

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
                      style={{ marginLeft: 10 }}
                    />
                  </>
                }
                secondary={
                  <>
                    {`${upDevices} UP / ${totalDevices} devices`}
                    <LinearProgress
                      variant="determinate"
                      value={upPercentage}
                      className={classes.progressBar}
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


// src/components/SiteDetails.js

import React, { useEffect, useState } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Container,
  Chip,
} from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { getDeviceList, getCurrentDownDevices } from '../services/deviceService';

const useStyles = makeStyles({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
  upDevice: {
    color: 'green',
  },
  downDevice: {
    color: 'red',
  },
});

function SiteDetails() {
  const classes = useStyles();
  const { siteId } = useParams();
  const [devices, setDevices] = useState([]);
  const [downDevices, setDownDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const deviceList = await getDeviceList();
        const currentDownDevices = (await getCurrentDownDevices()) || [];

        const filteredDevices = deviceList.filter((device) => {
          const hostname = device.hostname || '';
          const siteCode = hostname.substring(0, 5).toUpperCase();
          return siteCode === siteId.toUpperCase();
        });
        setDevices(filteredDevices);

        const filteredDownDevices = currentDownDevices.filter((device) => {
          const nwDeviceName = device.nwDeviceName || '';
          const siteCode = nwDeviceName.substring(0, 5).toUpperCase();
          return siteCode === siteId.toUpperCase();
        });
        setDownDevices(filteredDownDevices);
      } catch (error) {
        console.error('Error fetching site details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [siteId]);

  useEffect(() => {
    // Optionally, you can fetch the site name from the mapping
    const fetchSiteName = async () => {
      try {
        const siteMapping = await getSiteMapping();
        setSiteName(siteMapping[siteId] || siteId);
      } catch (error) {
        console.error('Error fetching site name:', error);
      }
    };
    fetchSiteName();
  }, [siteId]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  const downDeviceMacs = new Set(downDevices.map((device) => device.macAddress));

  return (
    <Container style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Site Details - {siteName || siteId}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Devices
      </Typography>
      <List>
        {devices.map((device) => {
          const isDown = downDeviceMacs.has(device.macAddress);
          return (
            <ListItem key={device.macAddress} className={classes.listItem}>
              <ListItemText
                primary={
                  <>
                    {device.hostname}
                    <Chip
                      label={isDown ? 'DOWN' : 'UP'}
                      color={isDown ? 'secondary' : 'primary'}
                      style={{ marginLeft: 10 }}
                    />
                  </>
                }
                className={isDown ? classes.downDevice : classes.upDevice}
              />
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
}

export default SiteDetails;


// src/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ThemeProvider } from '@material-ui/core/styles';
import theme from './theme';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);


// src/theme.js

import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // You can customize the primary color here
    },
    secondary: {
      main: '#dc004e', // You can customize the secondary color here
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
    },
  },
});

export default theme;


// src/components/Dashboard.js

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  makeStyles,
  Container,
} from '@material-ui/core';
import { getTotalDevices, getDownDevices } from '../services/deviceService';
import DeviceStatusChart from './DeviceStatusChart';

const useStyles = makeStyles({
  card: {
    minWidth: 200,
    textAlign: 'center',
  },
  metric: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
  },
});

function Dashboard() {
  const classes = useStyles();
  const [totalDevices, setTotalDevices] = useState(0);
  const [downDevicesCount, setDownDevicesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const total = await getTotalDevices();
        const downDevices = await getDownDevices();
        setTotalDevices(total);
        setDownDevicesCount(Object.keys(downDevices).length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upDevicesCount = totalDevices - downDevicesCount;

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Network Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card className={classes.card}>
            <CardContent>
              <Typography className={classes.metric}>{totalDevices}</Typography>
              <Typography className={classes.label}>Total Devices</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className={classes.card} style={{ color: 'green' }}>
            <CardContent>
              <Typography className={classes.metric}>{upDevicesCount}</Typography>
              <Typography className={classes.label}>Devices Up</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className={classes.card} style={{ color: 'red' }}>
            <CardContent>
              <Typography className={classes.metric}>{downDevicesCount}</Typography>
              <Typography className={classes.label}>Devices Down</Typography>
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
    </Container>
  );
}

export default Dashboard;


// src/components/DeviceStatusChart.js

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#FF8042'];

function DeviceStatusChart({ upDevices, downDevices }) {
  const data = [
    { name: 'Up Devices', value: upDevices },
    { name: 'Down Devices', value: downDevices },
  ];

  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}

export default DeviceStatusChart;


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
    res.json({ downDevices });
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
    res.json({ downDevices: downDeviceInfo }); // Modified to return { downDevices }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read current down device info' });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
