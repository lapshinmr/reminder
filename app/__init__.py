from config import config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)

    from .main import main
    app.register_blueprint(main)

    from .reminder import reminder
    app.register_blueprint(reminder)

    from .earnings import earnings
    app.register_blueprint(earnings)

    return app