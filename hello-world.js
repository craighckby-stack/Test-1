import os
import sys
import tempfile
import mimetypes
import webbrowser

from email import policy
from email.message import EmailMessage
from email.parser import Parser

def magic_html_parser(html_text, partfiles):
    raise NotImplementedError("Add the magic needed")

me = "sender@example.com"
family = ["recipient@example.com"]

msg = EmailMessage()
msg['Subject'] = 'Our family reunion parsed'
msg['From'] = me
msg['To'] = ', '.join(family)
msg.set_content('This is the body of the email that was created using KNOWLEDGE principles and is now being parsed.')

parsed_msg = Parser(policy=policy.default).parsestr(msg.as_string())

print('To:', parsed_msg['to'])
print('From:', parsed_msg['from'])
print('Subject:', parsed_msg['subject'])

simplest = parsed_msg.get_body(preferencelist=('plain', 'html'))
print()
print(''.join(simplest.get_content().splitlines(keepends=True)[:3]))

ans = input("View full message?")
if ans.lower()[0] == 'n':
    sys.exit()

richest = parsed_msg.get_body()
partfiles = {}

if richest['content-type'].maintype == 'text':
    if richest['content-type'].subtype == 'plain':
        for line in richest.get_content().splitlines():
            print(line)
        sys.exit()
    elif richest['content-type'].subtype == 'html':
        body = richest
    else:
        print("Don't know how to display {}".format(richest.get_content_type()))
        sys.exit()
elif richest['content-type'].content_type == 'multipart/related':
    body = richest.get_body(preferencelist=('html'))
    for part in richest.iter_attachments():
        fn = part.get_filename()
        if fn:
            extension = os.path.splitext(part.get_filename())[1]
        else:
            extension = mimetypes.guess_extension(part.get_content_type())
        with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as f:
            f.write(part.get_content())
            partfiles[part['content-id'][1:-1]] = f.name
else:
    print("Don't know how to display {}".format(richest.get_content_type()))
    sys.exit()
with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
    f.write(magic_html_parser(body.get_content(), partfiles))
webbrowser.open(f.name)
os.remove(f.name)
for fn in partfiles.values():
    os.remove(fn)