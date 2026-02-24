from email.message import EmailMessage
from email.parser import Parser
from email.policy import default

me = "sender@example.com"
family = ["recipient@example.com"]

msg = EmailMessage()
msg['Subject'] = 'Our family reunion parsed'
msg['From'] = me
msg['To'] = ', '.join(family)
msg.set_content('This is the body of the email that was created using KNOWLEDGE principles and is now being parsed.')

parsed_email_object = Parser(policy=default).parsestr(msg.as_string())