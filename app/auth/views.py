from flask import request, url_for, redirect, flash
from flask_login import login_user, login_required, logout_user
from . import auth
from .models import User


@auth.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    user = User.query.filter_by(email=email).first()
    if user is not None and user.verify_password(password):
        login_user(user)
        return redirect(request.args.get('next') or url_for('reminder.index'))
    #flash('Invalid username or password.')
    return redirect(url_for('reminder.index'))


@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    #flash('You have been logged out.')
    return redirect(url_for('reminder.index'))
