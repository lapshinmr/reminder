from app import db
from . import reminder
from .models import Task, Time
from flask import render_template, request, jsonify
import datetime
from .reminder_tools import TimeUnitsRanges


@reminder.route('/')
def index():
    tasks = Task.query.all()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return render_template(
        'reminder/index.html', tasks=tasks, tasks_times=tasks_times,
        time_units_ranges=TimeUnitsRanges().gen_all()
    )


@reminder.route('/add_task', methods=['POST'])
def add():
    task_name = request.form['task-name']
    time_loop = int(request.form['duration'])
    new_task = Task(name=task_name, time_loop=time_loop)
    db.session.add(new_task)
    db.session.commit()
    task = Task.query.filter_by(time_init=new_task.time_init).filter_by(name=new_task.name).first()
    return jsonify(task_item_html=render_template('reminder/task_item.html', task=task), task_id=task.id)


@reminder.route('/<task_id>/edit', methods=['POST'])
def edit(task_id):
    task = Task.query.filter_by(id=task_id).first()
    new_task_name = request.form.get('new_task_name')
    if task.name != new_task_name:
        task.name = new_task_name
        db.session.commit()
    return jsonify()


@reminder.route('/<task_id>/complete', methods=['POST'])
def complete(task_id):
    task = Task.query.filter_by(id=task_id).first()
    time_complete = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if task:
        time = Time(task=task)
        time.time_complete = time_complete
        task.time_last = time_complete
        db.session.commit()
    task = Task.query.filter_by(id=task_id).first()
    return jsonify(
        task_item_html=render_template('reminder/task_item.html', task=task),
        history_item_html=render_template('reminder/history_item.html', task=task)
    )


@reminder.route('/<task_id>/close', methods=['POST'])
def close(task_id):
    task = Task.query.filter_by(id=task_id).first()
    if task:
        times = Time.query.filter_by(task=task).all()
        if not any(times):
            db.session.delete(task)
        task.close()
        db.session.commit()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return jsonify(
        history_area_html=render_template('reminder/history_area.html', tasks_times=tasks_times)
    )


@reminder.route('/<task_id>/<time_complete>/remove', methods=['POST'])
def remove(task_id, time_complete):
    task = Task.query.filter_by(id=task_id).first()
    if task:
        time = Time.query.filter_by(task=task).filter_by(time_complete=time_complete).first()
        if time:
            db.session.delete(time)
        times = Time.query.filter_by(task=task).all()
        if task.is_close() and not any(times):
            db.session.delete(task)
        db.session.commit()
    return jsonify()


@reminder.route('/<task_id>/restore', methods=['POST'])
def restore(task_id):
    task = Task.query.filter_by(id=task_id).first()
    if task:
        task.time_close = None
        db.session.commit()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return jsonify(
        task_item_html=render_template('reminder/task_item.html', task=task),
        task_id=task.id,
        history_area_html=render_template('reminder/history_area.html', tasks_times=tasks_times)
    )

