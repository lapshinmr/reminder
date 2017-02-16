from app import db
from app.reminder.reminder_tools import *


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text())
    time_loop = db.Column(db.Float)
    time_init = db.Column(db.String(64))
    time_last = db.Column(db.String(64))
    time_close = db.Column(db.String(64))
    order_idx = db.Column(db.Integer)
    tab_id = db.Column(db.Integer, db.ForeignKey('tabs.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    times = db.relationship('Time', backref='task')
    time_format = "%Y-%m-%d %H:%M:%S"

    def __init__(self, name, time_loop, user_id, order_idx, tab_id):
        self.name = name
        self.update_time_loop(time_loop)
        self.user_id = user_id
        self.order_idx = order_idx
        self.tab_id = tab_id

    def __repr__(self):
        return '<Task %r>' % self.name

    def update_time_loop(self, time_loop):
        self.time_loop = time_loop
        self.time_init = datetime.datetime.now().strftime(self.time_format)
        self.time_last = self.time_init

    def update_order_idx(self, order_idx):
        self.order_idx = order_idx

    def count_left_time(self):
        duration_time = datetime.datetime.now() - datetime.datetime.strptime(self.time_last, self.time_format)
        left_time_obj = datetime.timedelta(0, self.time_loop) - duration_time
        left_time = left_time_obj.total_seconds()
        if left_time < 0:
            left_time = 0
        return left_time

    def show_left_time(self):
        return largest_timepart(self.count_left_time())

    def show_loop_time(self):
        return largest_timepart(self.time_loop)

    def close(self):
        self.time_close = datetime.datetime.now().strftime(self.time_format)

    def restore(self):
        self.time_close = None

    def is_active(self):
        return not self.time_close

    def is_close(self):
        return self.time_close

    def is_complete(self):
        pass


class Time(db.Model):
    __tablename__ = 'times'
    id = db.Column(db.Integer, primary_key=True)
    time_complete = db.Column(db.String(64))
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))

    def __repr__(self):
        return '<Time %r for task %r>' % (self.time_complete, self.task_id)


class Tab(db.Model):
    __tablename__ = 'tabs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    active = db.Column(db.Boolean)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    tasks = db.relationship('Task', backref='tab')

    def __repr__(self):
        return '<Tab %r for user %r>' % (self.name, self.user_id)

    def is_active(self):
        return self.active

    def activate(self):
        self.active = True

    def deactivate(self):
        self.active = False
