import os
from flask import request, url_for, redirect, flash, render_template
from flask_login import login_user, login_required, logout_user
from . import auth
from .models import User
from app import db


@auth.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    user = User.query.filter_by(email=email).first()
    if user is not None and user.verify_password(password):
        login_user(user)
        return redirect(request.args.get('next') or url_for('reminder.index'))
    else:
        pass
        # 'Invalid username or password.'
    return redirect(url_for('reminder.index'))


@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('reminder.index'))


@auth.route('/register', methods=['GET', 'POST'])
def register():
    email = request.form.get('email')
    username = request.form.get('username')
    password = request.form.get('password')
    if email and username and password:
        if not User.query.filter_by(email=email).first():
            user = User(email=email, username=username, password=password)
            db.session.add(user)
            db.session.commit()
        return redirect(url_for('reminder.index'))
    cur_config = os.environ.get('CONFIG')
    return render_template('auth/register.html', config=cur_config)
