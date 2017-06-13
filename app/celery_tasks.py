from datetime import datetime, timedelta
from app import celery
from app.email_tools import send_email
from celery.schedules import crontab
from app.models import User
from app.utils import make_subject
from flask import render_template


@celery.task
def send_async_email(to, subject, template, *attachments):
    send_email(to, subject, template, *attachments)


@celery.task
def send_tasks():
    users = User.query.all()
    for user in users:
        if not user.subscribed:
            continue
        if datetime.strftime(datetime.utcnow() + timedelta(hours=user.timezone), "%H") in user.schedule:
            to = user.email
            subject = make_subject("New tasks")
            message_text = render_template('email/ready_tasks.html', user=user)
            send_async_email(to, subject, message_text)


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(minute='0', hour='*/1'), send_tasks.s())



