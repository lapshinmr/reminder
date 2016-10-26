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

