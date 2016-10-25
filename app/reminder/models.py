from app import db
import datetime as dt
from datetime import datetime


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
        delta = datetime.now() - datetime.strptime(self.time_last, "%Y-%m-%d %H:%M:%S")
        left = dt.timedelta(0, self.time_loop) - delta
        return self.format_time(left.total_seconds())

    def show_loop_time(self):
        return self.format_time(self.time_loop)

    @staticmethod
    def format_time(input_seconds):
        delta = dt.timedelta(0, input_seconds)
        days, seconds = delta.days, delta.seconds
        hours, seconds = divmod(seconds, 3600)
        minutes, seconds = divmod(seconds, 60)
        if days < 0:
            return 'time is over'
        if days == 1:
            return '{} day'.format(days)
        elif days > 1:
            return '{} days'.format(days)
        elif hours == 1:
            return '{} hour'.format(hours)
        elif hours > 1:
            return '{} hours'.format(hours)
        elif minutes == 1:
            return '{} minute'.format(minutes)
        elif minutes > 1:
            return '{} minutes'.format(minutes)
        elif seconds == 1:
            return '{} second'.format(seconds)
        elif seconds > 1:
            return '{} seconds'.format(seconds)
        else:
            return 'time is over'


class Time(db.Model):
    __tablename__ = 'times'
    id = db.Column(db.Integer, primary_key=True)
    time_press = db.Column(db.String(64))
    button_id = db.Column(db.Integer, db.ForeignKey('buttons.id'))

    def __repr__(self):
        return '<Time %r>' % self.time_press
