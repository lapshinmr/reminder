import os
from oauth2client import client, tools
from oauth2client.file import Storage


SCOPES = 'https://www.googleapis.com/auth/gmail.compose'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'reminder'


try:
    import argparse
    print(tools.argparser)
    flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
    print(flags)
except ImportError:
    flags = None


def create_credentials():
    credential_path = os.path.join('.', 'gmail_credential.json')
    store = Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if flags:
            credentials = tools.run_flow(flow, store, flags)
        print('Storing credentials to ' + credential_path)
    return credentials


if __name__ == '__main__':
    create_credentials()