import os
from flask import request, url_for, redirect, render_template, flash
from flask_login import login_user, login_required, logout_user, current_user
from . import auth
from app.models import User
from app import db
from app.celery_tasks import send_async_email
from app.utils import make_subject


@auth.before_app_request
def before_request():
    if current_user.is_authenticated \
            and not current_user.confirmed \
            and request.endpoint[:5] != 'auth.' \
            and request.endpoint != 'static':
        return redirect(url_for('auth.unconfirmed'))


@auth.route('/unconfirmed')
def unconfirmed():
    if current_user.is_anonymous or current_user.confirmed:
        return redirect(url_for('main.index'))
    return render_template('auth/unconfirmed.html', config=os.environ.get('CONFIG'))


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember_me = request.form.get('remember_me')
        remember_me = True if remember_me else False
        user = User.query.filter_by(email=email).first()
        if user is not None and user.verify_password(password):
            login_user(user, remember_me)
            print(request.args.get('next'))
            return redirect(request.args.get('next') or url_for('main.index'))
        else:
            flash('Please, use your email and password to log in.')
    return render_template('auth/login.html', config=os.environ.get('CONFIG'))


@auth.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@auth.route('/signup', methods=['GET', 'POST'])
def signup():
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
            flash('Email with confirmation has been sent to your email address. Please go to your mailbox and use link'
                  'to confirm your account.')
        return redirect(url_for('auth.login'))
    return render_template('auth/signup.html', config=os.environ.get('CONFIG'))


@auth.route('/confirm/<token>', methods=['GET', 'POST'])
@login_required
def confirm(token):
    if current_user.confirmed:
        return redirect(url_for('main.index'))
    current_user.confirm(token)
    return redirect(url_for('main.index'))


@auth.route('/confirm')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    message_text = render_template('auth/email/confirm.txt', user=current_user, token=token)
    send_async_email.apply_async(
        args=[
            current_user.email,
            make_subject('Confirm Your Account'),
            message_text
        ]
    )
    flash('A new confirmation email has been sent to you by email.')
    return redirect(url_for('main.index'))


@auth.route('/reset', methods=['GET', 'POST'])
def password_reset_request():
    email = request.form.get('email')
    if email:
        user = User.query.filter_by(email=email).first()
        if user:
            token = user.generate_reset_token()
            message_text = render_template('email/reset_password.html', user=user, token=token)
            send_async_email.apply_async(
                args=[
                    user.email,
                    make_subject('Reset Your Password'),
                    message_text
                ]
            )
            flash('An email with instructions to reset your password has been sent to you.')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_password_request.html', config=os.environ.get('CONFIG'))


@auth.route('/reset/<token>', methods=['GET', 'POST'])
def password_reset(token):
    email = request.form.get('email')
    password = request.form.get('password')
    if email:
        user = User.query.filter_by(email=email).first()
        if user is None:
            return redirect(url_for('main.index'))
        if user.reset_password(token, password):
            flash('Your password has been updated.')
            return redirect(url_for('auth.login'))
        else:
            return redirect(url_for('main.index'))
    return render_template('auth/reset_password.html', token=token, config=os.environ.get('CONFIG'))


