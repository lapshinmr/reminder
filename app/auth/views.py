import os
from flask import request, url_for, redirect, render_template, flash, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from . import auth
from app.models import User, Tab
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
    if request.method == 'GET':
        return render_template('index.html', config=os.environ.get('CONFIG'))
    else:
        email = request.form.get('email')
        password = request.form.get('password')
        remember_me = request.form.get('remember_me')
        remember_me = True if remember_me else False
        user = User.query.filter_by(email=email).first()
        if user is not None and user.verify_password(password):
            login_user(user, remember_me)
            return redirect(request.args.get('next') or url_for('main.index'))
        return jsonify()


@auth.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))


@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        return render_template('index.html', config=os.environ.get('CONFIG'))
    else:
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')
        user_exist = User.query.filter_by(email=email).first()
        if email and username and password and not user_exist:
            user = User(email=email, username=username, password=password)
            db.session.add(user)
            db.session.commit()
            new_tab = Tab(name="new tab", user_id=user.id, active=True)
            new_tab.update_order_idx(0)
            db.session.add(new_tab)
            db.session.commit()
            token = user.generate_confirmation_token()
            message_text = render_template('email/confirm.txt', user=user, token=token)
            send_async_email.apply_async(
                args=[
                    user.email,
                    make_subject('Confirm Your Account'),
                    message_text
                ]
            )
            return jsonify(True)
        return jsonify(False)


@auth.route('/confirm/<token>', methods=['GET', 'POST'])
@login_required
def confirm(token):
    if current_user.confirmed:
        return redirect(url_for('main.index'))
    current_user.confirm(token)
    flash(u'You have just confirmed your account.', 'information')
    return redirect(url_for('main.index'))


@auth.route('/resend_confirmation')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    message_text = render_template('email/confirm.txt', user=current_user, token=token)
    send_async_email.apply_async(
        args=[
            current_user.email,
            make_subject('Confirm Your Account'),
            message_text
        ]
    )
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


