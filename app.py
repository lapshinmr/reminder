#!/env/bin/python3

from app import db, create_app
from app.reminder.models import Time, Button
from flask_script import Manager, Shell
from flask_migrate import Migrate, MigrateCommand


app = create_app('config')
manager = Manager(app)
migrate = Migrate(app, db)


def make_shell_context():
    return dict(app=app, db=db, Button=Button, Time=Time)
manager.add_command("shell", Shell(make_context=make_shell_context))
manager.add_command('db', MigrateCommand)


if __name__ == '__main__':
    manager.run()