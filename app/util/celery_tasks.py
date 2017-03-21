from app import celery
from app.util.email_tools import send_email


@celery.task
def send_async_email(to, subject, template, **kwargs):
    send_email(to, subject, template, **kwargs)




