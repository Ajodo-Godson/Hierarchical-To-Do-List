from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS

db = SQLAlchemy()
login_manager = LoginManager()
# login_manager.login_view = "auth.login"


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "your_secret_key"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///todo.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    CORS(app)
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
