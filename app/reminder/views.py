from . import reminder
from flask import render_template


@reminder.route('/reminder')
def index():
    return render_template('reminder/index.html')

