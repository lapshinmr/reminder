import os
from config import config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_assets import Bundle, Environment


db = SQLAlchemy()

login_manager = LoginManager()
login_manager.session_protection = 'strong'
login_manager.login_view = 'auth.login'

css = ['css/bootstrap.min.css', 'css/font-awesome.min.css', 'css/jquery-ui-1.12.1.min.css']
if os.environ.get('CONFIG') == 'prod':
    css.append('css/main.css')

bundels = {
    'main_css': Bundle(
        *css,
        output='gen/main.css',
        filters='cssmin'
    )
}
assets = Environment()
assets.register(bundels)


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