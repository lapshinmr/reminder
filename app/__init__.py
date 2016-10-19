from flask import Flask

app = Flask(__name__)

from .reminder import reminder
app.register_blueprint(reminder)

from .earnings import earnings
app.register_blueprint(earnings)