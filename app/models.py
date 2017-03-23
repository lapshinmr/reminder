from app import db, login_manager
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from app.utils import *


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True)
    email = db.Column(db.String(64), unique=True, index=True)
    password_hash = db.Column(db.String(128))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    tasks = db.relationship('Task', backref='user')
    tabs = db.relationship('Tab', backref='user')
    confirmed = db.Column(db.Boolean, default=False)
    send_tasks_flag = db.Column(db.Boolean, default=True)
    schedule = db.Column(db.String(128), default='none')

    def __init__(self, email, username, password):
        self.email = email
        self.username = username
        self.password = password

    def __repr__(self):
        return '<User %r>' % self.username

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_confirmation_token(self, expiration=3600):
        s = Serializer(current_app.config['SECRET_KEY'], expiration)
        return s.dumps({'confirm': self.id})

    def confirm(self, token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except:
            return False
        if data.get('confirm') != self.id:
            return False
        self.confirmed = True
        db.session.add(self)
        return True

    def activate_send_tasks_flag(self):
        self.send_tasks_flag = True

    def deactivate_send_tasks_flag(self):
        self.send_tasks_flag = False


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    users = db.relationship('User', backref='role')

    def __repr__(self):
        return '<Role %r>' % self.name


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


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
    order_idx = db.Column(db.Integer)
    tasks = db.relationship('Task', backref='tab')

    def __repr__(self):
        return '<Tab %r for user %r>' % (self.name, self.user_id)

    def is_active(self):
        return self.active

    def activate(self):
        self.active = True

    def deactivate(self):
        self.active = False

    def update_order_idx(self, order_idx):
        self.order_idx = order_idx
