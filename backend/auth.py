from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from .models import db, User
from flask_jwt_extended import create_access_token

# Create a Blueprint for authentication routes
auth = Blueprint("auth", __name__)


# Route for user signup
@auth.route("/signup", methods=["POST"])
def signup_post():
    data = request.json  # Get JSON data from the request
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")

    # Check if all required fields are provided
    if not email or not name or not password:
        return jsonify({"message": "All fields are required"}), 400

    # Check if a user with the same email already exists
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({"message": "Email address already exists"}), 400

    # Generate a username based on the email (before the '@' symbol)
    username = email.split("@")[0]

    # Create a new User instance with the provided details
    new_user = User(
        email=email,
        name=name,
        username=username,
        password=generate_password_hash(
            password, method="pbkdf2:sha256"
        ),  # Hash the password
    )

    # Add the new user to the database session and commit
    db.session.add(new_user)
    db.session.commit()

    # Return a success message
    return jsonify({"message": "Account created successfully"}), 200


# Route for user login
@auth.route("/login", methods=["POST"])
def login_post():
    data = request.json  # Get JSON data from the request
    email = data.get("email")
    password = data.get("password")

    # Check if both email and password are provided
    if not email or not password:
        return (
            jsonify({"success": False, "message": "Email and password are required"}),
            400,
        )

    # Query the user by email
    user = User.query.filter_by(email=email).first()

    # Check if user exists and if the password is correct
    if user is None or not check_password_hash(user.password, password):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    # Create a JWT access token using the user's ID as identity
    access_token = create_access_token(identity=user.id)

    # Log the user in using Flask-Login
    login_user(user)

    # Return the access token and a success message
    return (
        jsonify(
            {"success": True, "token": access_token, "message": "Login successful"}
        ),
        200,
    )


# Route for user logout
@auth.route("/logout")
@login_required  # Require the user to be logged in
def logout():
    logout_user()  # Log the user out using Flask-Login
    return jsonify({"message": "Logged out successfully"}), 200


# Helper function to create a unique username
def create_username(email, name):
    # Base the username on the email prefix
    username = email.split("@")[0]
    existing_user = User.query.filter_by(username=username).first()

    # If the username already exists, generate a new one based on the name
    if existing_user:
        base_username = name.lower().replace(" ", "")
        counter = 1
        # Increment the counter until a unique username is found
        while User.query.filter_by(username=f"{base_username}{counter}").first():
            counter += 1
        username = f"{base_username}{counter}"
    return username
