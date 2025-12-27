import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HydroUnits from './pages/HydroUnits';
import HydroUnitDetail from './pages/HydroUnitDetail';
import Rooms from './pages/Rooms';
import CameraMonitoring from './pages/CameraMonitoring';
import DataExport from './pages/DataExport';
import Settings from './pages/Settings';
import { SocketProvider } from './contexts/SocketContext';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SocketProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/hydro-units" element={<HydroUnits />} />
              <Route path="/hydro-units/:unitId" element={<HydroUnitDetail />} />
              <Route path="/cameras" element={<CameraMonitoring />} />
              <Route path="/export" element={<DataExport />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;