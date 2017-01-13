from app import db
from . import reminder
from .models import Task, Time
from flask import render_template, redirect, url_for, request, jsonify
import datetime
from .reminder_tools import TimeUnitsRanges


@reminder.route('/reminder', methods=['GET', 'POST'])
def index():
    tasks = Task.query.all()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return render_template(
        'reminder/index.html', tasks=tasks, tasks_times=tasks_times,
        time_units_ranges=TimeUnitsRanges().gen_all()
    )


@reminder.route('/reminder/add_task', methods=['POST'])
def add():
    print(request.form)
    task_name = request.form['task-name']
    time_loop = int(request.form['duration'])
    new_task = Task(name=task_name, time_loop=time_loop)
    db.session.add(new_task)
    db.session.commit()
    tasks = Task.query.all()
    return jsonify({
        'tasks': render_template('reminder/tasks_area.html', tasks=tasks)
    })


@reminder.route('/reminder/<task_id>/edit', methods=['GET', 'POST'])
def edit(task_id):
    task = Task.query.filter_by(id=task_id).first()
    new_task_name = request.form.get('new_task_name')
    if task.name != new_task_name:
        task.name = new_task_name
        db.session.commit()
    return jsonify()


@reminder.route('/reminder/<task_id>/complete')
def complete(task_id):
    task = Task.query.filter_by(id=task_id).first()
    time_complete = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if task:
        time = Time(task=task)
        time.time_complete = time_complete
        task.time_last = time_complete
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/<task_id>/close')
def close(task_id):
    task = Task.query.filter_by(name=task_id).first()
    if task:
        times = Time.query.filter_by(task=task).all()
        if not any(times):
            db.session.delete(task)
        task.close()
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/<task_id>/<time_complete>/remove')
def remove(task_id, time_complete):
    task = Task.query.filter_by(name=task_id).first()
    if task:
        time = Time.query.filter_by(task=task).filter_by(time_complete=time_complete).first()
        if time:
            db.session.delete(time)
        times = Time.query.filter_by(task=task).all()
        if task.is_close() and not any(times):
            db.session.delete(task)
        db.session.commit()
    return redirect(url_for('reminder.index'))


@reminder.route('/reminder/<task_id>/restore')
def restore(task_id):
    task = Task.query.filter_by(name=task_id).first()
    if task:
        task.time_close = None
        db.session.commit()
    return redirect(url_for('reminder.index'))

