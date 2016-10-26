from app import db
from .reminder_tools import *


class Button(db.Model):
    __tablename__ = 'buttons'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    time_loop = db.Column(db.Float)
    time_init = db.Column(db.String(64))
    time_last = db.Column(db.String(64))
    times = db.relationship('Time', backref='button')

    def __repr__(self):
        return '<Button %r>' % self.name

    def show_left_time(self):
        if not self.time_last:
            return 'push to activate'
        duration_time = datetime.datetime.now() - datetime.datetime.strptime(self.time_last, "%Y-%m-%d %H:%M:%S")
        left_time = datetime.timedelta(0, self.time_loop) - duration_time
        return self.largest_timepart(left_time.total_seconds())

    def show_loop_time(self):
        return self.largets_timepart(self.time_loop)


class Time(db.Model):
    __tablename__ = 'times'
    id = db.Column(db.Integer, primary_key=True)
    time_press = db.Column(db.String(64))
    button_id = db.Column(db.Integer, db.ForeignKey('buttons.id'))

    def __repr__(self):
        return '<Time %r>' % self.time_press
