from app import db
from . import reminder
from .models import Button, Time
from flask import render_template, redirect, url_for, request
import datetime
from .reminder_tools import TimeUnitsRanges


@reminder.route('/reminder', methods=['GET', 'POST'])
def index():
    if 'add_task_submit' in request.form:
        button_name = request.form['task_name']
        days = int(request.form['days'])
        hours = int(request.form['hours'])
        minutes = int(request.form['minutes'])
        seconds = int(request.form['seconds'])
        time_loop = datetime.timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds).total_seconds()
        button = Button.query.filter_by(name=button_name).first()
        if not button:
            new_button = Button(name=button_name, time_loop=time_loop)
            db.session.add(new_button)
        elif button.time_close:
            button.update(time_loop)
            button.restore()
        db.session.commit()
        return redirect(url_for('reminder.index'))
    buttons = Button.query.all()
    buttons_times = [(Button.query.filter_by(id=time.button_id).first(), time.time_press) for time in Time.query.all()]
    return render_template(
        'reminder/index.html', buttons=buttons, buttons_times=buttons_times,
        time_units_ranges=TimeUnitsRanges().gen_all()
    )


@reminder.route('/reminder/press/<button_name>')
def press(button_name):
    button = Button.query.filter_by(name=button_name).first()
    time_press = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if button:
        time = Time(button=button)
        time.time_press = time_press
        button.time_last = time_press
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/press/<button_name>/close')
def close(button_name):
    button = Button.query.filter_by(name=button_name).first()
    if button:
        button.close()
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/press/<button_name>/<time_press>/remove')
def remove(button_name, time_press):
    button = Button.query.filter_by(name=button_name).first()
    if button:
        time = Time.query.filter_by(button=button).filter_by(time_press=time_press).first()
        if time:
            db.session.delete(time)
        times = Time.query.filter_by(button=button).all()
        if button.is_close() and not any(times):
            db.session.delete(button)
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/press/<button_name>/restore')
def restore(button_name):
    button = Button.query.filter_by(name=button_name).first()
    if button:
        button.time_close = None
        db.session.commit()
    return redirect(url_for('reminder.index'))

