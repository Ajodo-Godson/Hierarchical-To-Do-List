// src/components/Signup.js

import React, { useState } from 'react'; // Import React and useState hook for managing state
import '../styles/auth.css';             // Import CSS styles specific to authentication components
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation after signup

// Define the API URL (ensure it matches your backend Flask server URL)
const API_URL = 'http://127.0.0.1:5000';

const Signup = () => {
    // Initialize state to hold form data
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
    });

    // State to hold messages (success or error)
    const [message, setMessage] = useState(null);

    // Hook for programmatic navigation
    const navigate = useNavigate();

    // Destructure formData for easier access to fields
    const { email, name, password, confirmPassword } = formData;

    // Handle changes in input fields
    const handleChange = (e) => {
        setFormData({
            ...formData, // Spread the existing form data
            [e.target.name]: e.target.value, // Update the specific field
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Basic validation to check if passwords match
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return; // Exit the function early if validation fails
        }

        try {
            // Send a POST request to the signup endpoint with the form data
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name, password }), // Convert data to JSON string
            });

            const data = await response.json(); // Parse the JSON response

            if (response.ok && data.success) {
                setMessage("Signup successful!");
                // Store the received token in local storage for future authenticated requests
                localStorage.setItem('token', data.token);
                // Redirect the user to the dashboard after successful signup
                navigate('/dashboard');
            } else {
                // Display an error message from the server or a default message
                setMessage(data.message || "Signup failed.");
            }
        } catch (error) {
            // Handle any errors that occur during the fetch operation
            console.error("Error during signup:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    return (
        <div className="auth-container signup-container">
            <h2>Sign Up</h2>
            {/* Display a message if one exists */}
            {message && <p>{message}</p>}
            {/* Signup form */}
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"          // Input type for email validation
                        id="email"
                        name="email"
                        value={email}
                        onChange={handleChange} // Update state on change
                        required               // Field is required
                    />
                </div>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"        // Input type for password masking
                        id="password"
                        name="password"
                        value={password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Sign Up</button> {/* Submit button */}
            </form>
        </div>
    );
};

export default Signup; // Export the Signup component for use in other parts of the app
