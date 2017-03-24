import os
import datetime
from flask import render_template, request, jsonify, get_template_attribute
from flask_login import current_user, login_required
from . import reminder
from app import db
from app.models import Task, Time, Tab, User
from app.utils import TimeUnitsRanges


@reminder.route('/', methods=['GET', 'POST'])
def index():
    cur_config = os.environ.get('CONFIG')
    if current_user.is_anonymous:
        return render_template('index.html', config=cur_config)
    else:
        tabs = Tab.query.filter_by(user_id=current_user.id).order_by(Tab.order_idx)
        tabs_tasks = []
        active_tab = 0
        for tab in tabs:
            if tab.is_active():
                active_tab = tab.id
            tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=tab.id).order_by(Task.order_idx).all()
            tabs_tasks.append([tab, tasks])
        return render_template(
            'reminder/index.html',
            config=cur_config,
            tabs=tabs,
            tabs_tasks=tabs_tasks,
            active_tab=active_tab,
            time_units_ranges=TimeUnitsRanges().gen_all(),
            user=current_user
        )


@reminder.route('/add_task', methods=['GET', 'POST'])
def add():
    task_name = request.form['task_name']
    time_loop = int(request.form['duration'])
    tab_id = int(request.form['tab_id'])
    new_task_idx = 0
    tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=tab_id).filter_by(time_close=None).order_by(Task.order_idx).all()
    for idx, task in enumerate(tasks, start=1):
        task.update_order_idx(idx)
    new_task = Task(name=task_name, time_loop=time_loop, user_id=current_user.id, order_idx=new_task_idx, tab_id=tab_id)
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
        task_item_html=get_template_attribute('reminder/macroses.html', 'create_task_item')(task)
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
    return jsonify()


@reminder.route('/change_task_idx', methods=['POST'])
def change_task_idx():
    new_tab_id = int(request.form.get('tab_id'))
    task_id = request.form.get('task_id')
    new_idx = int(request.form.get('order_idx')) - 1  # 1 is a python_offset
    tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=new_tab_id).order_by(Task.order_idx).all()
    task = Task.query.filter_by(id=task_id).first()
    old_tab_id = task.tab_id
    if old_tab_id != new_tab_id:
        task.tab_id = new_tab_id
    else:
        tasks.remove(task)
    tasks.insert(new_idx, task)
    for idx, task in enumerate(tasks):
        task.update_order_idx(idx)
    db.session.commit()
    return jsonify()


@reminder.route('/change_tab_order_idx', methods=['POST'])
def change_tab_order_idx():
    tab_id = request.form.get('tab_id')
    new_tab_order_idx = int(request.form.get('new_tab_order_idx')) - 1
    tabs = Tab.query.filter_by(user_id=current_user.id).order_by(Tab.order_idx).all()
    tab = Tab.query.filter_by(id=tab_id).first()
    tabs.remove(tab)
    tabs.insert(new_tab_order_idx, tab)
    for idx, tab in enumerate(tabs):
        tab.update_order_idx(idx)
    db.session.commit()
    return jsonify()


@reminder.route('/make_order', methods=['POST'])
def make_order():
    order_type = request.form.get('order_type')
    tab_id = request.form.get('tab_id')
    tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=tab_id).filter_by(time_close=None)
    old_order = [task.id for task in tasks.order_by(Task.order_idx).all()]
    if order_type == 'by_name':
        tasks_ordered = tasks.order_by(Task.name).all()
    elif order_type == 'by_time_init':
        tasks_ordered = tasks.order_by(Task.time_init).all()
    elif order_type == 'by_time_loop':
        tasks_ordered = tasks.order_by(Task.time_loop).all()
    elif order_type == 'by_time_left':
        tasks_times = [(task, task.count_left_time()) for task in tasks]
        tasks_times = sorted(tasks_times, key=lambda x: x[1])
        tasks_ordered = [task for task, time in tasks_times]
    else:
        tasks_ordered = tasks.order_by(Task.order_idx).all()
    for idx, task in enumerate(tasks_ordered, start=0):
        task.update_order_idx(idx)
    db.session.commit()
    new_order = [task.id for task in tasks_ordered]
    return jsonify({'old_order': old_order, 'new_order': new_order})


@reminder.route('/add_new_tab', methods=['POST'])
def add_new_tab():
    new_tab_name = request.form.get('new_tab_name')
    new_tab = Tab(name=new_tab_name, user_id=current_user.id, active=False)
    tabs = Tab.query.filter_by(user_id=current_user.id).all()
    new_tab.update_order_idx(len(tabs))
    db.session.add(new_tab)
    db.session.commit()
    tab_html = get_template_attribute('reminder/macroses.html', 'create_tabs')([new_tab])
    tab_content_html = get_template_attribute('reminder/macroses.html', 'create_tasks_area')([[new_tab, []]])
    return jsonify({
        'tab_id': new_tab.id,
        'tab': tab_html,
        'tab_content': tab_content_html
    })


@reminder.route('/activate_tab', methods=['POST'])
def activate_tab():
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
    tab_order_idx = tab.order_idx
    tab_is_active = tab.is_active
    tasks = Task.query.filter_by(user_id=current_user.id).filter_by(tab_id=tab_id).all()
    for task in tasks:
        db.session.delete(task)
    db.session.delete(tab)
    tabs = Tab.query.filter_by(user_id=current_user.id).order_by(Tab.order_idx).all()
    for idx, tab in enumerate(tabs, start=0):
        tab.update_order_idx(idx)
    db.session.commit()
    if tab_is_active():
        if tab_order_idx == len(tabs):
            tab_order_idx -= 1
    else:
        tab_order_idx = -1
    return jsonify({'active_tab_idx': tab_order_idx})


@reminder.route('/subscribe')
def subscribe():
    current_user.subscribed
    return



@reminder.route('/schedule', methods=['POST'])
def schedule():
    pass


@reminder.route('/settings')
@login_required
def settings():
    cur_config = os.environ.get('CONFIG')
    return render_template('reminder/settings.html', user=current_user, config=cur_config)