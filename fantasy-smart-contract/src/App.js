// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import CreateLeague from './components/CreateLeague'; 
import ViewLeague from './components/ViewLeague';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} exact />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/createleague" element={<CreateLeague />} />
        <Route path="/leagues/:leagueId" element={<ViewLeague />} /> 
      </Routes>
    </Router>
  );
}

export default App;
