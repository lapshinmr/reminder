import datetime


def largest_timepart(input_in_seconds):
    delta = datetime.timedelta(0, input_in_seconds)
    days, seconds = delta.days, delta.seconds
    hours = divmod(seconds, 3600)[0]
    minutes, seconds = divmod(seconds, 60)
    if days < 0:
        return 'time is over'
    if days == 1:
        return '{} day'.format(days)
    elif days > 1:
        return '{} days'.format(days)
    elif hours == 1:
        return '{} hour'.format(hours)
    elif hours > 1:
        return '{} hours'.format(hours)
    elif minutes == 1:
        return '{} minute'.format(minutes)
    elif minutes > 1:
        return '{} minutes'.format(minutes)
    elif seconds == 1:
        return '{} second'.format(seconds)
    elif seconds > 1:
        return '{} seconds'.format(seconds)
    else:
        return 'time is over'


class TimeUnitsRanges:
    days = 100
    hours = 24
    minutes = 60
    seconds = 60

    @staticmethod
    def gen_time_range(amount):
        return [(idx, '{:02}'.format(idx)) for idx in range(amount)]

    def gen_all(self):
        return {
            'days': self.gen_time_range(self.days),
            'hours': self.gen_time_range(self.hours),
            'minutes': self.gen_time_range(self.minutes),
            'seconds': self.gen_time_range(self.seconds)
        }
