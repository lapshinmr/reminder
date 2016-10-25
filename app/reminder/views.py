from app import db
from . import reminder
from .models import Button, Time
from flask import render_template, redirect, url_for, request
from datetime import datetime


@reminder.route('/reminder', methods=['GET', 'POST'])
def index():
    if 'add_form' in request.form:
        button_name = request.form['name']
        time_loop = request.form['time_loop']
        new_button = Button(name=button_name, time_loop=time_loop)
        db.session.add(new_button)
        db.session.commit()
    elif 'update_form' in request.form:
        button_name = request.form['name']
        button_new_name = request.form['new_name']
        time_loop = request.form['time_loop']
        button = Button.query.filter_by(name=button_name).first()
        if button_name and button_new_name:
            button.name = button_new_name
        if button_name and time_loop:
            button.time_init = time_loop
        db.session.commit()
    elif 'del_form' in request.form:
        button_name = request.form['name']
        button = Button.query.filter_by(name=button_name).first()
        if button:
            times = Time.query.filter_by(button=button).all()
            for time in times:
                db.session.delete(time)
            db.session.delete(button)
            db.session.commit()
    buttons = Button.query.all()
    return render_template('reminder/index.html', buttons=buttons)


@reminder.route('/reminder/press/<button_name>')
def press(button_name):
    button = Button.query.filter_by(name=button_name).first()
    time_press = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if button:
        if not button.time_init:
            button.time_init = time_press
        else:
            time = Time(button=button)
            time.time_press = time_press
        button.time_last = time_press
        db.session.commit()
    return redirect(url_for('reminder.index'))
