import os
import base64
import httplib2
from flask import current_app, render_template
from oauth2client.file import Storage
from apiclient import discovery, errors
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart, MIMEBase
from email import encoders


SCOPES = 'https://www.googleapis.com/auth/gmail.compose'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'reminder'


def get_credentials():
    credential_path = os.path.join('.', 'gmail_credential.json')
    store = Storage(credential_path)
    credentials = store.get()
    return credentials


def create_message(sender, to, subject, message_text):
    message = MIMEText(message_text)
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    return {'raw': base64.b64encode(bytes(str(message), "utf-8")).decode()}


def create_message_with_attachment(sender, to, subject, message_text, *attachment_paths):
    message = MIMEMultipart()
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    message.attach(MIMEText(message_text))

    for file_path in attachment_paths:
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(open(file_path, 'rb').read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', 'attachment', filename=os.path.basename(file_path))
        message.attach(part)
    return {'raw': base64.urlsafe_b64encode(str(message).encode('utf-8')).decode()}


def send_message(user_id, message):
    credentials = get_credentials()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('gmail', 'v1', http=http, cache_discovery=False)
    try:
        message = (service.users().messages().send(userId=user_id, body=message).execute())
        return message
    except errors.HttpError as error:
        print('An error occurred: %s' % error)


def send_email(to, subject, template, **kwargs):
    app = current_app._get_current_object()
    sender = 'me'
    subject = '{} {}'.format(app.config['MAIL_SUBJECT_PREFIX'], subject)
    body = render_template(template + '.txt', **kwargs)
    message = create_message(sender, to, subject, body)
    send_message(sender, message)


def send_email_with_attachment(to, subject, template, *args, **kwargs):
    app = current_app._get_current_object()
    sender = 'me'
    subject = '{} {}'.format(app.config['MAIL_SUBJECT_PREFIX'], subject)
    body = render_template(template + '.txt', **kwargs)
    message = create_message_with_attachment(sender, to, subject, body, *args)
    send_message(sender, message)
