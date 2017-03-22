import os
import base64
import httplib2
from oauth2client.file import Storage
from apiclient import discovery, errors
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart, MIMEBase
from email import encoders


SCOPES = 'https://www.googleapis.com/auth/gmail.compose'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'reminder'


def create_message(sender, to, subject, message_text, *attachment_paths):
    message = MIMEMultipart()
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    message.attach(MIMEText(message_text))
    for file_path in attachment_paths:
        if not os.path.exists(file_path):
            continue
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(open(file_path, 'rb').read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', 'attachment', filename=os.path.basename(file_path))
        message.attach(part)
    return {'raw': base64.urlsafe_b64encode(str(message).encode('utf-8')).decode()}


def send_email(to, subject, message_text, *attachments):
    sender = 'me'
    message = create_message(sender, to, subject, message_text, *attachments)
    credentials = Storage(os.path.join('.', 'gmail_credential.json')).get()
    http = credentials.authorize(httplib2.Http())
    service = discovery.build('gmail', 'v1', http=http, cache_discovery=False)
    try:
        service.users().messages().send(userId=sender, body=message).execute()
    except errors.HttpError as error:
        print('An error occurred: %s' % error)
