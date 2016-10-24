import os


class Config:
    DEBUG = True
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    SQLALCHEMY_DATABASE_URI = 'mysql://{user}:{password}@{host}/data'.format(
        user=os.environ['USER'], password=os.environ['PASSWORD'], host='localhost')

    @staticmethod
    def init_app(app):
        pass


config = {
    'config': Config
}
