import React from 'react';
import {
  BrowserRouter as Router, // Alias Router for BrowserRouter
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'; // Import routing components from react-router-dom
import Signup from './components/Signup';       // Import the Signup component
import Login from './components/Login';         // Import the Login component
import Dashboard from './components/Dashboard'; // Import the Dashboard component
import './App.css';                             // Import the main CSS file

// Navigation component handles the navigation bar logic
const Navigation = () => {
  const location = useLocation();   // Hook to get the current location object
  const navigate = useNavigate();   // Hook to programmatically navigate

  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from local storage
    navigate('/login');               // Redirect the user to the login page
  };

  return (
    <nav>
      <ul>
        {/* Conditional rendering based on the current path */}
        {location.pathname === '/dashboard' ? (
          // If on the dashboard page, show the Log Out button
          <li>
            <button onClick={handleLogout}>Log Out</button>
          </li>
        ) : (
          // If not on the dashboard page, show the Sign Up and Log In links
          <>
            <li>
              <Link to="/signup">Sign Up</Link>
            </li>
            <li>
              <Link to="/login">Log In</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

// Main App component that sets up routing
const App = () => {
  return (
    <Router>
      {/* Include the Navigation component so it appears on all pages */}
      <Navigation />
      <Routes>
        {/* Define routes for different paths */}
        <Route path="/signup" element={<Signup />} />         {/* Route for the Signup page */}
        <Route path="/login" element={<Login />} />           {/* Route for the Login page */}
        <Route path="/dashboard" element={<Dashboard />} />   {/* Route for the Dashboard page */}
        <Route path="/" element={<h1>Welcome to the App!</h1>} /> {/* Default route (homepage) */}
      </Routes>
    </Router>
  );
};

export default App; // Export the App component as the default export
