import os


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = True

    @staticmethod
    def init_app(app):
        pass


class ProdConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'mysql://{user}:{password}@{host}/data'.format(
        user=os.environ['USER'], password=os.environ['PASSWORD'], host='localhost')


class DevConfig(Config):
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
