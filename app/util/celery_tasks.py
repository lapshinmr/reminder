from app import celery
from app.util.email_tools import send_email
from celery.schedules import crontab


@celery.task
def send_async_email(to, subject, template, *attachments):
    send_email(to, subject, template, *attachments)


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls test('hello') every 10 seconds.
    sender.add_periodic_task(10.0, test.s('hello'), name='add every 10')

    # Calls test('world') every 30 seconds
    sender.add_periodic_task(30.0, test.s('world'), expires=10)

    # Executes every Monday morning at 7:30 a.m.
    sender.add_periodic_task(
        crontab(hour=7, minute=30, day_of_week=1),
        test.s('Happy Mondays!'),
    )


@celery.task
def test(arg):
    print(arg)



