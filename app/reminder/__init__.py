from flask import Blueprint

reminder = Blueprint('reminder', __name__)

from . import views
