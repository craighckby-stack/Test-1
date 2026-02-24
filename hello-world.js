from email.parser import Parser
from email.policy import default

Parser(policy=default).parsestr('From: Foo Bar <user@example.com>\n'
                                'To: <someone_else@example.com>\n'
                                'Subject: Test message\n'
                                '\n'
                                'Body would go here\n')