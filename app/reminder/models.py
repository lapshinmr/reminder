from app import db
from .reminder_tools import *


class Button(db.Model):
    __tablename__ = 'buttons'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    time_loop = db.Column(db.Float)
    time_init = db.Column(db.String(64))
    time_last = db.Column(db.String(64))
    time_close = db.Column(db.String(64))
    times = db.relationship('Time', backref='button')
    time_format = "%Y-%m-%d %H:%M:%S"

    def __init__(self, name, time_loop):
        self.name = name
        self.time_loop = time_loop
        self.time_init = datetime.datetime.now().strftime(self.time_format)
        self.time_last = self.time_init

    def __repr__(self):
        return '<Button %r>' % self.name

    def count_left_time(self):
        duration_time = datetime.datetime.now() - datetime.datetime.strptime(self.time_last, self.time_format)
        left_time = datetime.timedelta(0, self.time_loop) - duration_time
        return left_time.total_seconds()

    def show_left_time(self):
        return largest_timepart(self.count_left_time())

    def show_loop_time(self):
        return largest_timepart(self.time_loop)

    def close(self):
        self.time_close = datetime.datetime.now().strftime(self.time_format)

    def is_active(self):
        return not self.time_close

    def is_close(self):
        return self.time_close


class Time(db.Model):
    __tablename__ = 'times'
    id = db.Column(db.Integer, primary_key=True)
    time_press = db.Column(db.String(64))
    button_id = db.Column(db.Integer, db.ForeignKey('buttons.id'))

    def __repr__(self):
        return '<Time %r for button %r>' % (self.time_press, self.button_id)
