import os
from flask import request, url_for, redirect, render_template, current_app
from flask_login import login_user, login_required, logout_user, current_user
from . import auth
from .models import User
from app import db
from app.util.celery_tasks import send_async_email


def make_subject(subject):
    return '{} {}'.format(current_app.config['MAIL_SUBJECT_PREFIX'], subject)


@auth.route('/login', methods=['GET', 'POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')
    remember_me = request.form.get('remember_me')
    remember_me = True if remember_me else False
    user = User.query.filter_by(email=email).first()
    if user is not None and user.verify_password(password):
        login_user(user, remember_me)
        return redirect(request.args.get('next') or url_for('reminder.index'))
    cur_config = os.environ.get('CONFIG')
    return render_template('auth/login.html', config=cur_config)


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
            token = user.generate_confirmation_token()
            message_text = render_template('auth/email/confirm.txt', user=user, token=token)
            send_async_email.apply_async(
                args=[
                    user.email,
                    make_subject('Confirm Your Account'),
                    message_text
                ]
            )
        return redirect(url_for('reminder.index'))
    cur_config = os.environ.get('CONFIG')
    return render_template('auth/register.html', config=cur_config)


@auth.route('/confirm/<token>')
@login_required
def confirm(token):
    if current_user.confirmed:
        return redirect(url_for('reminder.index'))
    current_user.confirm(token)
    return redirect(url_for('reminder.index'))
