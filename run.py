#!env/bin/python3

from app import db, create_app
from app.reminder.models import Time, Task
from flask_script import Manager, Shell
from flask_migrate import Migrate, MigrateCommand


app = create_app('developing')
manager = Manager(app)
migrate = Migrate(app, db)


def make_shell_context():
    return dict(app=app, db=db, Task=Task, Time=Time)
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