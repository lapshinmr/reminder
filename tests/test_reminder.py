import unittest
from app import create_app, db
from app.reminder.models import Task
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

    def test_create_task(self):
        new_task = Task('test', 60)
        self.assertTrue(new_task.name)
        self.assertTrue(new_task.time_loop)
        self.assertTrue(new_task.time_init)
        self.assertTrue(new_task.time_last)

    def test_write_task_to_db(self):
        new_task = Task('test', 60)
        db.session.add(new_task)
        db.session.commit()
        task = Task.query.filter_by(name='test').first()
        self.assertTrue(task)

    def test_is_close(self):
        new_task = Task('test', 60)
        new_task.close()
        self.assertTrue(new_task.is_close())

    def test_is_active(self):
        new_task = Task('test', 60)
        self.assertTrue(new_task.is_active())


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

    def test_gen_time_range(self):
        case = [
            ([], 0),
            ([(0, '00'), (1, '01'), (2, '02')], 3)
        ]
        for output, amount in case:
            self.assertEqual(TimeUnitsRanges.gen_time_range(amount), output)


