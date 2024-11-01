// src/components/Login.js

import React, { useState } from 'react';
import '../styles/auth.css';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:5000'; // Ensure this matches your Flask server URL

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [message, setMessage] = useState(null);

    const { email, password } = formData;
    const navigate = useNavigate(); // Initialize useNavigate

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/login`, { // Adjust the endpoint based on your blueprint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies in the request
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage("Login successful!");
                // Store the JWT token in local storage
                localStorage.setItem('token', data.token);
                // Redirect to dashboard
                navigate('/dashboard');
            } else {
                setMessage(data.message || "Login failed.");
            }

        } catch (error) {
            console.error("Error during login:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    return (
        <div className="auth-container login-container">
            <h2>Log In</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        required
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
                        required
                    />
                </div>
                <button type="submit">Log In</button>
            </form>
        </div>
    );
};

export default Login;
