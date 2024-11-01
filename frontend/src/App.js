import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav>
      <ul>
        {location.pathname === '/dashboard' ? (
          <li><button onClick={handleLogout}>Log Out</button></li>
        ) : (
          location.pathname === '/' ? (
            <li>
              Do you have an account?{' '}
              <Link to="/login">Log In</Link>
              <span>or</span>
              <Link to="/signup">Sign Up</Link>
            </li>
          ) : (
            <>
              <li><Link to="/signup">Sign Up</Link></li>
              <li><Link to="/login">Log In</Link></li>
            </>
          )
        )}
      </ul>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path="/" element={
              <div className="welcome">
                <h1>Welcome to your Hierarchical To-Do App!</h1>
                <p>Get organized and boost your productivity with our intuitive task management system.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;