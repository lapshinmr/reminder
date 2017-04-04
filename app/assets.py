import os
from flask_assets import Bundle, Environment


css = ['css/bootstrap.min.css', 'css/font-awesome.min.css', 'css/jquery-ui-1.12.1.min.css']
if os.environ.get('CONFIG') == 'prod':
    css.append('css/main.css')

bundels = {

    'main_js': Bundle(
        'js/main.js',
        'js/input-validation.js',
        'js/durationpicker.js',
        'js/settings.js',
        'js/popup.js',
        output='gen/main.js'
        #filters='jsmin'
    ),

    'main_css': Bundle(
        *css,
        output='gen/main.css',
        filters='cssmin'
    )
}
assets = Environment()
assets.register(bundels)
