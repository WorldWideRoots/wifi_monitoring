// src/theme.js

import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  palette: {
    type: 'dark', // Use 'mode' instead of 'type' if you're using Material-UI v5
    primary: {
      main: '#90caf9', // Light blue shade
    },
    secondary: {
      main: '#f48fb1', // Pink shade
    },
    background: {
      default: '#303030', // Medium dark grey
      paper: '#424242', // Slightly lighter grey
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#b0bec5',
    },
  },
});

export default theme;

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

const useStyles = makeStyles((theme) => ({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
  progressBar: {
    marginTop: 5,
  },
}));

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
        {filteredSites.map(([siteCode, siteName]) => {
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
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@material-ui/core';
import { useParams } from 'react-router-dom';
import {
  getDeviceList,
  getCurrentDownDevices,
  getSiteMapping,
  getDownDevices,
} from '../services/deviceService';
import DeviceStatusChart from './DeviceStatusChart';

const useStyles = makeStyles((theme) => ({
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
}));

function SiteDetails() {
  const classes = useStyles();
  const { siteId } = useParams();
  const [siteName, setSiteName] = useState('');
  const [devices, setDevices] = useState([]);
  const [downDevicesInfo, setDownDevicesInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const siteMapping = await getSiteMapping();
        setSiteName(siteMapping[siteId] || siteId);

        const deviceList = await getDeviceList();
        const currentDownDevices = (await getCurrentDownDevices()) || [];
        const downDevicesJson = await getDownDevices();

        // Create a mapping for down devices from downDevicesJson
        const downDevicesTimestamps = downDevicesJson || {};

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
          const macAddress = device.macAddress;
          const downSinceEpoch = downDevicesTimestamps[macAddress];
          const downSinceDate = downSinceEpoch ? new Date(downSinceEpoch) : null;
          return {
            ...device,
            downSinceEpoch,
            downSinceDate,
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

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
  };

  const handleCloseDialog = () => {
    setSelectedDevice(null);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  const totalDevicesCount = devices.length;
  const downDevicesCount = downDevicesInfo.length;
  const upDevicesCount = totalDevicesCount - downDevicesCount;

  return (
    <Container style={{ padding: 20 }}>
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
      <List>
        {downDevicesInfo.map((device) => (
          <ListItem
            button
            key={device.macAddress}
            className={classes.listItem}
            onClick={() => handleDeviceClick(device)}
          >
            <ListItemText
              primary={device.nwDeviceName}
              secondary={`Down Since: ${
                device.downSinceDate ? device.downSinceDate.toLocaleString() : 'Unknown'
              }`}
            />
          </ListItem>
        ))}
      </List>

      {/* Device Detail Dialog */}
      <Dialog open={!!selectedDevice} onClose={handleCloseDialog}>
        <DialogTitle>Device Details</DialogTitle>
        {selectedDevice && (
          <DialogContent>
            <DialogContentText>
              <strong>Device Name:</strong> {selectedDevice.nwDeviceName}
            </DialogContentText>
            <DialogContentText>
              <strong>MAC Address:</strong> {selectedDevice.macAddress}
            </DialogContentText>
            <DialogContentText>
              <strong>Location:</strong> {selectedDevice.location}
            </DialogContentText>
            <DialogContentText>
              <strong>Down Since:</strong>{' '}
              {selectedDevice.downSinceDate
                ? selectedDevice.downSinceDate.toLocaleString()
                : 'Unknown'}
            </DialogContentText>
            <DialogContentText>
              <strong>Last Updated:</strong>{' '}
              {new Date(parseInt(selectedDevice.timestamp)).toLocaleString()}
            </DialogContentText>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SiteDetails;


// src/services/deviceService.js

import { fetchData } from './api';

export const getTotalDevices = async () => {
  const data = await fetchData('/total-devices');
  return data.totalDevices;
};

export const getDownDevices = async () => {
  const data = await fetchData('/down-devices');
  return data.downDevices; // This should return the downDevices dictionary
};

export const getSiteMapping = async () => {
  const data = await fetchData('/site-mapping');
  return data.siteMapping;
};

export const getDeviceList = async () => {
  const data = await fetchData('/device-list');
  return data.deviceList;
};

export const getCurrentDownDevices = async () => {
  const data = await fetchData('/current-down-device-info');
  return data.downDevices;
};


// src/components/DeviceStatusChart.js

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#90caf9', '#f48fb1']; // Match theme colors

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


// GET /api/down-devices
app.get('/api/down-devices', async (req, res) => {
    try {
      const downDevices = await readJSONFile('data/down_devices.json');
      res.json(downDevices); // Return the dictionary directly
    } catch (error) {
      res.status(500).json({ error: 'Failed to read down devices' });
    }
  });
  