from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from .models import db, User

auth = Blueprint("auth", __name__)


@auth.route("/signup", methods=["POST"])
def signup_post():
    email = request.form.get("email")
    name = request.form.get("name")
    password = request.form.get("password")

    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({"message": "Email address already exists"}), 400

    username = create_username(email, name)
    new_user = User(
        email=email,
        name=name,
        username=username,
        password=generate_password_hash(password, method="pbkdf2:sha256"),
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Account created successfully. Please log in."}), 201


@auth.route("/login", methods=["POST"])
def login_post():
    email = request.form.get("email")
    password = request.form.get("password")
    remember = True if request.form.get("remember") else False

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return (
            jsonify({"message": "Please check your login details and try again."}),
            401,
        )

    login_user(user, remember=remember)
    print("Successfully logged in", current_user)
    return (
        jsonify(
            {"message": "Logged in successfully", "redirect": url_for("main.profile")}
        ),
        200,
    )


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
