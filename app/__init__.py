from config import config, Config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from .assets import assets
from celery import Celery


db = SQLAlchemy()

login_manager = LoginManager()
login_manager.session_protection = 'strong'
login_manager.login_view = 'auth.login'


# Initialize Celery
celery = Celery(__name__, broker=Config.CELERY_BROKER_URL)


def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)
    login_manager.init_app(app)

    assets.init_app(app)

    celery.conf.update(app.config)

    from .main import main
    app.register_blueprint(main)

    from .auth import auth
    app.register_blueprint(auth, prefix='/auth')

    return app
