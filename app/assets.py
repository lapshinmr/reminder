import os
from flask_assets import Bundle, Environment


css = [
    'css/jquery-ui-1.12.1.min.css',
    'css/bootstrap.min.css',
    'css/flat-ui.min.css',
    'css/font-awesome.min.css'
]

js = [
    'js/jquery-3.1.1.min.js',
    'js/flat-ui.min.js',
    'js/jquery-ui-1.12.1.min.js',
    'js/application.js',
    'js/jquery.validate.min.js',
    'js/main.js',
    'js/validations.js',
    'js/duration-picker.js',
    'js/settings.js',
    'js/modals.js',
    'js/tabs.js'
]

if os.environ.get('CONFIG') == 'prod':
    css.append('css/main.css')
else:
    js.append('js/less-2.7.2.min.js')


bundles = {
    'main_js': Bundle(
        *js,
        output='gen/main.js'
    ),
    'main_css': Bundle(
        *css,
        output='gen/main.css',
        filters='cssmin'
    )
}

assets = Environment()
assets.register(bundles)
