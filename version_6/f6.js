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
    backgroundColor: theme.palette.background.default, // Ensure container follows theme
    minHeight: '100vh', // Optional: Ensure full height
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
    backgroundColor: theme.palette.action.selected, // Highlight selected row
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
                      <IconButton
                        size="small"
                        onClick={() => handleRowClick(device.macAddress)}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
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
                            {device.downSinceDate
                              ? device.downSinceDate.toLocaleString()
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

// src/services/deviceService.js

import { fetchData } from './api';

export const getTotalDevices = async () => {
  const data = await fetchData('/total-devices');
  return data.totalDevices;
};

export const getDownDevices = async () => {
  const data = await fetchData('/down-devices');
  return data; // Return the downDevices dictionary directly
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

// src/theme.js

import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Switch back to dark mode
    primary: {
      main: '#90caf9', // Light blue
    },
    secondary: {
      main: '#f48fb1', // Pink
    },
    background: {
      default: '#2e2e2e', // Medium dark grey
      paper: '#424242', // Slightly lighter grey
    },
    text: {
      primary: '#ffffff', // White text
      secondary: '#b0bec5', // Light grey text
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
