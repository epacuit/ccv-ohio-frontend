import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Container, Typography, Paper, Box } from '@mui/material';
import theme from './theme/theme';
import CreatePoll from './pages/CreatePoll';
import PollCreatedSuccess from './pages/PollCreatedSuccess';
import Vote from './pages/Vote'; 
import VoteSuccess from './pages/VoteSuccess';
import PollResults from './pages/PollResults';
import DevTools from './pages/DevTools';
import Admin from './pages/Admin';
import HomePage from './pages/Home';
import NavigationBar from './components/NavigationBar'; 
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CSVImportTool  from './pages/CSVImportTool';
import MyPolls from './pages/MyPolls';
import DemoPage from './pages/DemoPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
// Component to detect embedding status from URL
const AppContent = () => {
  const location = useLocation();
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Check for embedded=true URL parameter
    const searchParams = new URLSearchParams(location.search);
    const embedded = searchParams.get('embedded') === 'true';
    setIsEmbedded(embedded);
  }, [location.search]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Conditionally render NavigationBar only if not embedded */}
      {!isEmbedded && <NavigationBar />}
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/csv-import" element={<CSVImportTool />} />
          <Route path="/create" element={<CreatePoll isEmbedded={isEmbedded} />} />
          <Route path="/poll-created" element={<PollCreatedSuccess />} />
          <Route path="/vote/:pollId" element={<Vote />} />
          <Route path="/vote-success/:pollId" element={<VoteSuccess />} />
          {/*<Route path="/about" element={<About />} />*/}
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/results/:pollId" element={<PollResults />} />
          <Route path="/my-polls/:email" element={<MyPolls />} />
          <Route path="/admin/:pollId" element={<Admin />} />
          <Route path="/dev" element={<DevTools />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />

        </Routes>
      </Box>
      
      {/* Conditionally render Footer only if not embedded */}
      {!isEmbedded && <Footer />}
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;