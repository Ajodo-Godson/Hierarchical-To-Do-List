import React, { useState } from 'react';
import '../styles/auth.css';
import { useNavigate } from 'react-router-dom';

// Define the API URL (ensure this matches your Flask server URL)
const API_URL = 'http://127.0.0.1:5000';

const Login = () => {
    // State for form data (email and password)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // State for displaying messages (e.g., success or error messages)
    const [message, setMessage] = useState(null);

    // Destructure email and password from formData for convenience
    const { email, password } = formData;

    // Initialize useNavigate hook for navigation after login
    const navigate = useNavigate();

    // Handle input changes and update formData state
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value, // Update the specific field (email or password)
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior

        try {
            // Make a POST request to the login endpoint
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies in the request
                body: JSON.stringify({ email, password }), // Send email and password in the request body
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage("Login successful!");
                // Store the JWT token in local storage for future authenticated requests
                localStorage.setItem('token', data.token);
                // Redirect the user to the dashboard
                navigate('/dashboard');
            } else {
                // Display an error message from the response or a default one
                setMessage(data.message || "Login failed.");
            }

        } catch (error) {
            // Handle any errors that occurred during the request
            console.error("Error during login:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    return (
        <div className="auth-container login-container">
            <h2>Log In</h2>
            {/* Display a message if one exists */}
            {message && <p>{message}</p>}
            {/* Login form */}
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        required // Field is required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={handleChange}
                        required // Field is required
                    />
                </div>
                <button type="submit">Log In</button>
            </form>
        </div>
    );
};

export default Login;
