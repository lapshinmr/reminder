#!env/bin/python3

import os
from app import db, create_app
from app.reminder.models import Time, Task
from app.auth.models import User, Role
from flask_script import Manager, Shell
from flask_migrate import Migrate, MigrateCommand


print(os.environ.get('CONFIG'))
app = create_app(os.environ.get('CONFIG') or 'dev')
app.config['SECRET_KEY'] = 'hard to guess string'
manager = Manager(app)
migrate = Migrate(app, db)


def make_shell_context():
    return dict(app=app, db=db, Task=Task, Time=Time, User=User, Role=Role)
manager.add_command("shell", Shell(make_context=make_shell_context))
manager.add_command('db', MigrateCommand)


@manager.command
def test():
    """Run the unit tests."""
    import unittest
    tests = unittest.TestLoader().discover('tests')
    unittest.TextTestRunner(verbosity=2).run(tests)

if __name__ == '__main__':
    manager.run()