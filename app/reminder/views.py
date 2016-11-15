from app import db
from . import reminder
from .models import Task, Time
from flask import render_template, redirect, url_for, request
import datetime
from .reminder_tools import TimeUnitsRanges


@reminder.route('/reminder', methods=['GET', 'POST'])
def index():
    if 'add_task_submit' in request.form:
        task_name = request.form['task_name']
        days = int(request.form['days'])
        hours = int(request.form['hours'])
        minutes = int(request.form['minutes'])
        seconds = int(request.form['seconds'])
        time_loop = datetime.timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds).total_seconds()
        task = Task.query.filter_by(name=task_name).first()
        if not task:
            new_task = Task(name=task_name, time_loop=time_loop)
            db.session.add(new_task)
        elif task.time_close:
            task.update(time_loop)
            task.restore()
        db.session.commit()
        return redirect(url_for('reminder.index'))
    tasks = Task.query.all()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return render_template(
        'reminder/index.html', tasks=tasks, tasks_times=tasks_times,
        time_units_ranges=TimeUnitsRanges().gen_all()
    )


@reminder.route('/reminder/<task_name>/complete')
def complete(task_name):
    task = Task.query.filter_by(name=task_name).first()
    time_complete = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if task:
        time = Time(task=task)
        time.time_complete = time_complete
        task.time_last = time_complete
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/<task_name>/close')
def close(task_name):
    task = Task.query.filter_by(name=task_name).first()
    if task:
        times = Time.query.filter_by(task=task).all()
        if not any(times):
            db.session.delete(task)
        task.close()
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/<task_name>/<time_complete>/remove')
def remove(task_name, time_complete):
    task = Task.query.filter_by(name=task_name).first()
    if task:
        time = Time.query.filter_by(task=task).filter_by(time_complete=time_complete).first()
        if time:
            db.session.delete(time)
        times = Time.query.filter_by(task=task).all()
        if task.is_close() and not any(times):
            db.session.delete(task)
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/<task_name>/restore')
def restore(task_name):
    task = Task.query.filter_by(name=task_name).first()
    if task:
        task.time_close = None
        db.session.commit()
    return redirect(url_for('reminder.index'))

