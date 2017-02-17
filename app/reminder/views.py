import datetime
from app import db
from . import reminder
from app.reminder.models import Task, Time, Tab
from flask import render_template, request, jsonify, get_template_attribute
from flask_login import current_user
from app.reminder.reminder_tools import TimeUnitsRanges


USER_ID = None


@reminder.before_request
def before_first_request():
    global USER_ID
    USER_ID = current_user.id


@reminder.route('/', methods=['GET', 'POST'])
def index():
    if current_user.is_anonymous:
        return render_template('auth/index.html')
    tabs = Tab.query.filter_by(user_id=current_user.id)
    tabs_tasks = []
    for tab in tabs:
        tasks = Task.query.filter_by(user_id=USER_ID).filter_by(tab_id=tab.id).order_by(Task.order_idx).all()
        tabs_tasks.append([tab, tasks])
    #tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return render_template(
        'reminder/index.html',
        tabs=tabs,
        tabs_tasks=tabs_tasks,
    #    tasks_times=tasks_times,
        time_units_ranges=TimeUnitsRanges().gen_all()
    )


@reminder.route('/add_task', methods=['GET', 'POST'])
def add():
    task_name = request.form['task_name']
    time_loop = int(request.form['duration'])
    tab_id = int(request.form['tab_id'])
    new_task_idx = 0
    tasks = Task.query.filter_by(user_id=USER_ID).filter_by(tab_id=tab_id).filter_by(time_close=None).order_by(Task.order_idx).all()
    for idx, task in enumerate(tasks, start=1):
        task.update_order_idx(idx)
    new_task = Task(name=task_name, time_loop=time_loop, user_id=USER_ID, order_idx=new_task_idx, tab_id=tab_id)
    db.session.add(new_task)
    db.session.commit()
    return jsonify(
        task_item_html=get_template_attribute('reminder/macroses.html', 'create_task_item')(new_task),
        task_id=new_task.id)


@reminder.route('/edit', methods=['POST'])
def edit():
    task_id = request.form.get('task_id')
    task = Task.query.filter_by(id=task_id).first()
    new_task_name = request.form.get('new_task_name')
    if task.name != new_task_name:
        task.name = new_task_name
        db.session.commit()
    return jsonify()


@reminder.route('/complete', methods=['POST'])
def complete():
    task_id = request.form.get('task_id')
    task = Task.query.filter_by(id=task_id).first()
    time_complete = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if task:
        time = Time(task=task)
        time.time_complete = time_complete
        task.time_last = time_complete
        db.session.commit()
    task = Task.query.filter_by(id=task_id).first()
    return jsonify(
        task_item_html=get_template_attribute('reminder/macroses.html', 'create_task_item')(task),
        history_item_html=get_template_attribute('reminder/macroses.html', 'create_history_item')(task)
    )


@reminder.route('/close', methods=['POST'])
def close():
    task_id = request.form.get('task_id')
    task = Task.query.filter_by(id=task_id).first()
    if task:
        times = Time.query.filter_by(task=task).all()
        if not any(times):
            db.session.delete(task)
        task.close()
        db.session.commit()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return jsonify(
        history_area_html=get_template_attribute('reminder/macroses.html', 'create_history_area')(tasks_times)
    )


@reminder.route('/remove', methods=['POST'])
def remove():
    task_id = request.form.get('task_id')
    time_complete = request.form.get('time_complete')
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


@reminder.route('/restore', methods=['POST'])
def restore():
    task_id = request.form.get('task_id')
    task = Task.query.filter_by(id=task_id).first()
    if task:
        task.time_close = None
        db.session.commit()
    tasks_times = [(Task.query.filter_by(id=time.task_id).first(), time.time_complete) for time in Time.query.all()]
    return jsonify(
        task_item_html=get_template_attribute('reminder/macroses.html', 'create_task_item')(task),
        task_id=task.id,
        history_area_html=get_template_attribute('reminder/macroses.html', 'create_history_area')(tasks_times)
    )


@reminder.route('/change_order_idx', methods=['POST'])
def change_order_idx():
    tab_id = request.form.get('tab_id')
    task_id = request.form.get('task_id')
    python_offset = 1
    new_order_idx = int(request.form.get('order_idx')) - python_offset
    task = Task.query.filter_by(id=task_id).first()
    tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=tab_id).order_by(Task.order_idx).all()
    old_order_idx = task.order_idx
    tasks.insert(new_order_idx, tasks.pop(old_order_idx))
    for idx, task in enumerate(tasks):
        task.update_order_idx(idx)
    db.session.commit()
    return jsonify()


@reminder.route('/make_order', methods=['POST'])
def make_order():
    order_type = request.form.get('order_type')
    tab_id = request.form.get('tab_id')
    tasks = Task.query.filter_by(user_id=USER_ID).filter_by(tab_id=tab_id).filter_by(time_close=None)
    old_order = [task.id for task in tasks.order_by(Task.order_idx).all()]
    if order_type == 'by_name':
        tasks_ordered = tasks.order_by(Task.name).all()
    elif order_type == 'by_time_init':
        tasks_ordered = tasks.order_by(Task.time_init).all()
    elif order_type == 'by_time_loop':
        tasks_ordered = tasks.order_by(Task.time_loop).all()
    else:
        tasks_ordered = tasks.order_by(Task.order_idx).all()
    for idx, task in enumerate(tasks_ordered, start=0):
        task.update_order_idx(idx)
    db.session.commit()
    new_order = [task.id for task in tasks_ordered]
    print(old_order)
    print(new_order)
    return jsonify({'old_order': old_order, 'new_order': new_order})


@reminder.route('/add_new_tab', methods=['POST'])
def add_new_tab():
    new_tab_name = request.form.get('new_tab_name')
    if new_tab_name:
        new_tab = Tab(name=new_tab_name, user_id=current_user.id, active=True)
        tabs = Tab.query.filter_by(user_id=current_user.id).all()
        for tab in tabs:
            tab.deactivate()
        db.session.add(new_tab)
        db.session.commit()
    active_tab = Tab.query.filter_by(user_id=current_user.id).filter_by(active=True).first()
    return jsonify({'tab_id': active_tab.id})


@reminder.route('/switch_tab', methods=['POST'])
def switch_tab():
    current_tab_id = int(request.form.get('current_tab_id'))
    tabs = Tab.query.filter_by(user_id=current_user.id).all()
    for tab in tabs:
        if tab.id != current_tab_id and tab.is_active():
            tab.deactivate()
        elif tab.id == current_tab_id:
            tab.activate()
    db.session.commit()
    return jsonify()


@reminder.route('/close_tab', methods=['POST'])
def close_tab():
    tab_id = request.form.get('tab_id')
    tab = Tab.query.filter_by(id=tab_id).first()
    tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=tab_id).all()
    for task in tasks:
        db.session.delete(task)
    db.session.delete(tab)
    db.session.commit()
    return jsonify()
