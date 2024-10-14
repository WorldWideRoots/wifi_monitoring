// Frontend Setup using React and Material-UI

// Step 1: Create the Frontend Project
// Run the following commands in your terminal to create a React app:
// npx create-react-app frontend
// cd frontend
// npm install @material-ui/core @material-ui/icons axios react-router-dom

// Step 2: Set Up File Structure
// src/
// ├── components/
// │    ├── Header.js
// │    ├── Dashboard.js
// │    ├── SiteList.js
// │    └── SiteDetails.js
// ├── App.js
// ├── index.js
// └── services/
//      ├── api.js
//      └── deviceService.js

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
  try {
    const response = await api.get('/site-mapping');
    console.log("Fetched Site Mapping:", response.data.siteMapping); // Added for debugging
    return response.data.siteMapping;
  } catch (error) {
    console.error("Error fetching site mapping:", error);
    return {};
  }
};

export const getDeviceList = async () => {
  try {
    const response = await api.get('/device-list');
    return response.data.deviceList;
  } catch (error) {
    console.error("Error fetching device list:", error);
    return [];
  }
};

export const getCurrentDownDevices = async () => {
  try {
    const response = await api.get('/current-down-device-info');
    return response.data.downDevices;
  } catch (error) {
    console.error("Error fetching current down devices:", error);
    return [];
  }
};

// src/components/SiteList.js

import React, { useEffect, useState } from 'react';
import { Typography, List, ListItem, ListItemText, makeStyles } from '@material-ui/core';
import { getSiteMapping, getCurrentDownDevices } from '../services/deviceService';
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
      const deviceList = await getDeviceList();
      const currentDownDevices = (await getCurrentDownDevices()) || [];

      // Calculate total devices per site
      const counts = {};
      deviceList.forEach((device) => {
        const siteCode = device.hostname.substring(0, 5).toUpperCase();
        if (counts[siteCode]) {
          counts[siteCode] += 1;
        } else {
          counts[siteCode] = 1;
        }
      });
      setDeviceCounts(counts);

      // Calculate down devices per site
      const downCounts = {};
      currentDownDevices.forEach((device) => {
        const siteCode = device.nwDeviceName.substring(0, 5).toUpperCase();
        if (downCounts[siteCode]) {
          downCounts[siteCode] += 1;
        } else {
          downCounts[siteCode] = 1;
        }
      });
      setDownDeviceCounts(downCounts);

      setSites(siteMapping);
    };
    fetchSites();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Sites
      </Typography>
      <List>
        {Object.entries(sites).map(([siteCode, siteName]) => (
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


// src/components/SiteDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, List, ListItem, ListItemText, makeStyles } from '@material-ui/core';
import { getDeviceList, getCurrentDownDevices } from '../services/deviceService';

const useStyles = makeStyles({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
});

function SiteDetails() {
  const classes = useStyles();
  const { siteId } = useParams();
  const [devices, setDevices] = useState([]);
  const [downDevices, setDownDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const deviceList = await getDeviceList();
      const currentDownDevices = (await getCurrentDownDevices()) || [];

      // Filter devices for the current site
      const filteredDevices = deviceList.filter(
        (device) => device.hostname.substring(0, 5).toUpperCase() === siteId.toUpperCase()
      );
      setDevices(filteredDevices);

      // Filter down devices for the current site
      const filteredDownDevices = currentDownDevices.filter(
        (device) => device.nwDeviceName.substring(0, 5).toUpperCase() === siteId.toUpperCase()
      );
      setDownDevices(filteredDownDevices);
    };
    fetchDevices();
  }, [siteId]);

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Site Details - {siteId}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Devices
      </Typography>
      <List>
        {devices.map((device) => (
          <ListItem key={device.macAddress} className={classes.listItem}>
            <ListItemText
              primary={`${device.hostname} - ${downDevices.some(d => d.macAddress === device.macAddress) ? 'DOWN' : 'UP'}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default SiteDetails;




export const getSiteMapping = async () => {
  try {
    const response = await api.get('/site-mapping');
    console.log("Fetched Site Mapping:", response.data.siteMapping); // Added for debugging
    return response.data.siteMapping;
  } catch (error) {
    console.error("Error fetching site mapping:", error);
    return {};
  }
};

export const getDeviceList = async () => {
  try {
    const response = await api.get('/device-list');
    return response.data.deviceList;
  } catch (error) {
    console.error("Error fetching device list:", error);
    return [];
  }
};

export const getCurrentDownDevices = async () => {
  try {
    const response = await api.get('/current-down-device-info');
    return response.data.downDevices;
  } catch (error) {
    console.error("Error fetching current down devices:", error);
    return [];
  }
};



// src/components/SiteList.js

// src/services/deviceService.js
import api from './api';

export const getSiteMapping = async () => {
  try {
    const response = await api.get('/site-mapping');
    console.log("Fetched Site Mapping:", response.data.siteMapping); // Added for debugging
    return response.data.siteMapping;
  } catch (error) {
    console.error("Error fetching site mapping:", error);
    return {};
  }
};

export const getDeviceList = async () => {
  try {
    const response = await api.get('/device-list');
    return response.data.deviceList;
  } catch (error) {
    console.error("Error fetching device list:", error);
    return [];
  }
};

export const getCurrentDownDevices = async () => {
  try {
    const response = await api.get('/current-down-device-info');
    return response.data.downDevices;
  } catch (error) {
    console.error("Error fetching current down devices:", error);
    return [];
  }
};

import React, { useEffect, useState } from 'react';
import { Typography, List, ListItem, ListItemText, makeStyles } from '@material-ui/core';
import { getSiteMapping, getDeviceList, getCurrentDownDevices } from '../services/deviceService';
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
      const deviceList = await getDeviceList();
      const currentDownDevices = (await getCurrentDownDevices()) || [];

      // Calculate total devices per site
      const counts = {};
      deviceList.forEach((device) => {
        const siteCode = device.hostname.substring(0, 5).toUpperCase();
        if (counts[siteCode]) {
          counts[siteCode] += 1;
        } else {
          counts[siteCode] = 1;
        }
      });
      setDeviceCounts(counts);

      // Calculate down devices per site
      const downCounts = {};
      currentDownDevices.forEach((device) => {
        const siteCode = device.nwDeviceName.substring(0, 5).toUpperCase();
        if (downCounts[siteCode]) {
          downCounts[siteCode] += 1;
        } else {
          downCounts[siteCode] = 1;
        }
      });
      setDownDeviceCounts(downCounts);

      setSites(siteMapping);
    };
    fetchSites();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Sites
      </Typography>
      <List>
        {Object.entries(sites).map(([siteCode, siteName]) => (
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

// src/components/SiteDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, List, ListItem, ListItemText, makeStyles } from '@material-ui/core';
import { getDeviceList, getCurrentDownDevices } from '../services/deviceService';

const useStyles = makeStyles({
  listItem: {
    textDecoration: 'none',
    color: 'inherit',
  },
});

function SiteDetails() {
  const classes = useStyles();
  const { siteId } = useParams();
  const [devices, setDevices] = useState([]);
  const [downDevices, setDownDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const deviceList = await getDeviceList();
      const currentDownDevices = (await getCurrentDownDevices()) || [];

      // Filter devices for the current site
      const filteredDevices = deviceList.filter(
        (device) => device.hostname.substring(0, 5).toUpperCase() === siteId.toUpperCase()
      );
      setDevices(filteredDevices);

      // Filter down devices for the current site
      const filteredDownDevices = currentDownDevices.filter(
        (device) => device.nwDeviceName.substring(0, 5).toUpperCase() === siteId.toUpperCase()
      );
      setDownDevices(filteredDownDevices);
    };
    fetchDevices();
  }, [siteId]);

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Site Details - {siteId}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Devices
      </Typography>
      <List>
        {devices.map((device) => (
          <ListItem key={device.macAddress} className={classes.listItem}>
            <ListItemText
              primary={`${device.hostname} - ${downDevices.some(d => d.macAddress === device.macAddress) ? 'DOWN' : 'UP'}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default SiteDetails;







# ---------------------------------- 2222 # 


src/services/api.js.

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

export default api;

src/services/deviceService.js

import { fetchData } from './api';

export const getTotalDevices = async () => {
  const data = await fetchData('/total-devices');
  return data.totalDevices;
};

export const getDownDevices = async () => {
  const data = await fetchData('/down-devices');
  return data.downDevices;
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

