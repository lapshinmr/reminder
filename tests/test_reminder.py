import unittest
from app import create_app, db
from app.reminder.models import Button
from app.reminder.reminder_tools import *


class ButtonTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_create_button(self):
        new_button = Button('test', 60)
        self.assertTrue(new_button.name)
        self.assertTrue(new_button.time_loop)
        self.assertTrue(new_button.time_init)
        self.assertTrue(new_button.time_last)

    def test_write_button_to_db(self):
        new_button = Button('test', 60)
        db.session.add(new_button)
        db.session.commit()
        button = Button.query.filter_by(name='test').first()
        self.assertTrue(button)

    def test_close(self):
        new_button = Button('test', 60)
        new_button.close()
        self.assertTrue(new_button.time_close)


class ReminderToolsTestCase(unittest.TestCase):
    def test_largest_timepart(self):
        case = [
            (0, 'time is over'),
            (1, '1 second'),
            (2, '2 seconds'),
            (60, '1 minute')
        ]
        for input_time, output_message in case:
            self.assertEqual(largest_timepart(input_time), output_message)

