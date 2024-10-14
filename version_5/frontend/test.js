// Step 3: Implement the Header Component

// src/components/Header.js
import React from 'react';
import { AppBar, Toolbar, Typography, makeStyles } from '@material-ui/core';
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
  title: {
    flexGrow: 1,
    textDecoration: 'none',
    color: 'inherit',
  },
  link: {
    marginRight: 20,
    textDecoration: 'none',
    color: 'inherit',
  },
});

function Header() {
  const classes = useStyles();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" className={classes.title} component={Link} to="/">
          AP Monitoring System
        </Typography>
        <Typography variant="body1" component={Link} to="/" className={classes.link}>
          Dashboard
        </Typography>
        <Typography variant="body1" component={Link} to="/sites" className={classes.link}>
          Sites
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

// Step 4: Implement the Dashboard Component

// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, makeStyles } from '@material-ui/core';
import { getTotalDevices, getDownDevices } from '../services/deviceService';

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

  useEffect(() => {
    const fetchData = async () => {
      const total = await getTotalDevices();
      const downDevices = await getDownDevices();
      setTotalDevices(total);
      setDownDevicesCount(Object.keys(downDevices).length);
    };
    fetchData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
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
          <Card className={classes.card} style={{ color: 'red' }}>
            <CardContent>
              <Typography className={classes.metric}>{downDevicesCount}</Typography>
              <Typography className={classes.label}>Devices Down</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default Dashboard;

// Step 5: Set Up Routing and App Component

// src/App.js

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SiteList from './components/SiteList';
import SiteDetails from './components/SiteDetails';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<SiteList />} />
        <Route path="/sites/:siteId" element={<SiteDetails />} />
      </Routes>
    </Router>
  );
}

export default App;

// Step 6: Create Services to Fetch Data from Backend

// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;

// src/services/deviceService.js
import api from './api';

export const getTotalDevices = async () => {
  const response = await api.get('/total-devices');
  return response.data.totalDevices;
};

export const getDownDevices = async () => {
  const response = await api.get('/down-devices');
  return response.data.downDevices;
};

export const getSiteMapping = async () => {
  const response = await api.get('/site-mapping');
  return response.data.siteMapping;
};


// Step 7: Implement the SiteList Component

// src/components/SiteList.js
import React, { useEffect, useState } from 'react';
import { Typography, List, ListItem, ListItemText, makeStyles } from '@material-ui/core';
import { getSiteMapping, getDeviceList, getDownDevices } from '../services/deviceService';
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
});

function SiteList() {
  const classes = useStyles();
  const [sites, setSites] = useState({});
  const [deviceCounts, setDeviceCounts] = useState({});
  const [downDeviceCounts, setDownDeviceCounts] = useState({});

  useEffect(() => {
    const fetchSites = async () => {
      const siteMapping = await getSiteMapping();
      setSites(siteMapping);

      const deviceList = await getDeviceList();
      const downDevices = await getDownDevices();

      const counts = {};
      const downCounts = {};

      deviceList.forEach((device) => {
        const siteCode = device.hostname.substring(0, 5);
        if (counts[siteCode]) {
          counts[siteCode] += 1;
        } else {
          counts[siteCode] = 1;
        }
      });

      Object.values(downDevices).forEach((device) => {
        const siteCode = device.hostname.substring(0, 5);
        if (downCounts[siteCode]) {
          downCounts[siteCode] += 1;
        } else {
          downCounts[siteCode] = 1;
        }
      });

      setDeviceCounts(counts);
      setDownDeviceCounts(downCounts);
    };
    fetchSites();
  }, []);

  const sortedSites = Object.entries(sites).sort(([, siteNameA], [, siteNameB]) => {
    const downCountA = downDeviceCounts[siteNameA] || 0;
    const downCountB = downDeviceCounts[siteNameB] || 0;
    return downCountB - downCountA;
  });

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Sites
      </Typography>
      <List>
        {sortedSites.map(([siteCode, siteName]) => (
          <ListItem
            button
            key={siteCode}
            component={Link}
            to={`/sites/${siteCode}`}
            className={classes.listItem}
          >
            <ListItemText
              primary={`${siteName} (${(deviceCounts[siteCode] || 0) - (downDeviceCounts[siteCode] || 0)} UP / ${deviceCounts[siteCode] || 0} devices)`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default SiteList;

