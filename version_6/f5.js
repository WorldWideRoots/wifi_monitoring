// src/theme.js

import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // Use 'mode' instead of 'type' in Material-UI v5
    primary: {
      main: '#1976d2', // Blue shade
    },
    secondary: {
      main: '#d32f2f', // Red shade
    },
    background: {
      default: '#f0f0f0', // Light grey background
      paper: '#ffffff', // White for paper elements
    },
    text: {
      primary: '#000000', // Black text
      secondary: '#424242', // Dark grey text
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
    },
    body1: {
      color: '#000000',
    },
    body2: {
      color: '#424242',
    },
  },
});

export default theme;


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
    backgroundColor: theme.palette.action.hover,
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
                            {new Date(parseInt(device.timestamp)).toLocaleString()}
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


// src/components/DeviceStatusChart.js

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#1976d2', '#d32f2f']; // Blue and red to match the theme

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


// src/components/SiteDetails.js

// ... (imports as above)

import TablePagination from '@material-ui/core/TablePagination';

// ... (rest of the code)

function SiteDetails() {
  // ... (existing state variables)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ... (existing useEffect and functions)

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ... (rest of the component)

  return (
    <Container className={classes.container}>
      {/* ... existing content ... */}

      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="down devices table">
          {/* ... existing TableHead ... */}
          <TableBody>
            {downDevicesInfo
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((device) => {
                // ... existing code for table rows ...
              })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={downDevicesInfo.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Container>
  );
}

// ... (export as above)
