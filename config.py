import os


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SERVER_NAME = os.environ.get('SERVER_NAME')
    # Celery configuration
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

    @staticmethod
    def init_app(app):
        pass


class ProdConfig(Config):
    MAIL_SUBJECT_PREFIX = '[reminder]'
    SQLALCHEMY_DATABASE_URI = 'mysql://{user}:{password}@{host}/data'.format(
        user=os.environ['USER'], password=os.environ['PASSWORD'], host='localhost')


class DevConfig(Config):
    MAIL_SUBJECT_PREFIX = '[reminder-dev]'
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'mysql://{user}:{password}@{host}/data'.format(
        user=os.environ['USER'], password=os.environ['PASSWORD'], host='localhost')


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'mysql://{user}:{password}@{host}/data_test'.format(
        user=os.environ['USER'], password=os.environ['PASSWORD'], host='localhost')


config = {
    'prod': ProdConfig,
    'dev': DevConfig,
    'test': TestConfig
}
