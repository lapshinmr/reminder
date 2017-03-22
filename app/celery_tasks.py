from app import celery
from app.email_tools import send_email
from celery.schedules import crontab
from app.models import User


@celery.task
def send_async_email(to, subject, template, *attachments):
    send_email(to, subject, template, *attachments)


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(minute='*/1'),
        send_user_tasks.s(),
    )


@celery.task
def send_user_tasks():
    users = User.query.all()
    for user in users:
        to = user.email
        send_async_email()
        print(user)
        print(user.tasks)



