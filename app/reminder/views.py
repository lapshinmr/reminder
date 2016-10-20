from . import reminder
from flask import render_template, redirect, url_for


@reminder.route('/reminder')
def index():
    return render_template('reminder/index.html')


@reminder.route('/reminder/press/<button>')
def press(button):
    print(button)
    return redirect(url_for('reminder.index'))
