from config import config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from .util.assets import assets


db = SQLAlchemy()

login_manager = LoginManager()
login_manager.session_protection = 'strong'
login_manager.login_view = 'auth.login'


def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)
    login_manager.init_app(app)

    assets.init_app(app)

    from .reminder import reminder
    app.register_blueprint(reminder)

    from .auth import auth
    app.register_blueprint(auth, prefix='/auth')

    return app