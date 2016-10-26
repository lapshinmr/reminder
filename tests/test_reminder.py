import unittest
from app.reminder.models import Button
from app.reminder.reminder_tools import *


class ButtonTestCase(unittest.TestCase):
    def test_create_button(self):
        new_button = Button(name='test', time_loop=60)
        self.assertTrue(new_button.name)
        self.assertTrue(new_button.time_loop)
        self.assertFalse(new_button.time_init)


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

