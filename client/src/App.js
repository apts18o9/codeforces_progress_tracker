

import React from 'react';

import { BrowserRouter as Router } from 'react-router-dom';

// Import the new MainAppContent component
import MainAppContent from './MainAppContent';


export default function App() {
    return (
        <Router>
            {/* MainAppContent holds all the application's state and routing logic */}
            <MainAppContent />
        </Router>
    );
}
