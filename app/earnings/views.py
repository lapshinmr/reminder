from . import earnings
from flask import render_template


@earnings.route('/earnings')
def earnings():
    return render_template('earnings/index.html')