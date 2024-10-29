from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from .models import db, User

auth = Blueprint("auth", __name__)


@auth.route("/signup", methods=["POST"])
def signup_post():
    data = request.json
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")

    if not email or not name or not password:
        return jsonify({"message": "All fields are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({"message": "Email address already exists"}), 400

    username = email.split("@")[0]
    new_user = User(
        email=email,
        name=name,
        username=username,
        password=generate_password_hash(password, method="pbkdf2:sha256"),
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Account created successfully"}), 200


@auth.route("/login", methods=["POST"])
def login_post():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return (
            jsonify({"success": False, "message": "Email and password are required"}),
            400,
        )

    user = User.query.filter_by(email=email).first()

    # Check if user exists
    if user is None:
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    # Check if the provided password is correct
    if not check_password_hash(user.password, password):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    # Log the user in
    login_user(user)
    return jsonify({"success": True, "message": "Login successful"}), 200


@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


def create_username(email, name):
    username = email.split("@")[0]
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        base_username = name.lower().replace(" ", "")
        counter = 1
        while User.query.filter_by(username=f"{base_username}{counter}").first():
            counter += 1
        username = f"{base_username}{counter}"
    return username
