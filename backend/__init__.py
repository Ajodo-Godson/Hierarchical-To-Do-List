from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
login_manager = LoginManager()
# login_manager.login_view = "auth.login"


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "your_secret_key"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///todo.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["CORS_HEADERS"] = "Content-Type"
    app.config["CORS_SUPPORTS_CREDENTIALS"] = True
    app.config["JWT_SECRET_KEY"] = "your_secret_key"  # Replace with a strong secret key
    jwt = JWTManager(app)
    # app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    # app.config["SESSION_COOKIE_SECURE"] = False
    # app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",  # Necessary for cross-origin cookies
        SESSION_COOKIE_SECURE=False,  # Set to True if using HTTPS in production
    )
    # CORS(app)
    CORS(
        app,
        supports_credentials=True,  # Add This
        origins=["http://localhost:3000"],
    )
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)

    # Register blueprints
    from .auth import auth as auth_bp
    from .routes import main as main_bp
    from .todo import todo as todo_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(todo_bp)

    # Create database tables if they do not exist
    with app.app_context():
        db.create_all()

    return app
