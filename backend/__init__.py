from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)


if __name__ == '__main__':

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    app.run()