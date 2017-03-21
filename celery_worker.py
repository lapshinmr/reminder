#!/usr/bin/env python
import os
from app import celery, create_app

app = create_app(os.getenv('CONFIG') or 'dev')
app.app_context().push()
