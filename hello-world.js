from email.parser import Parser
from email.policy import Policy, default
from email.message import EmailMessage

class MyCustomPolicy(Policy):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.message_factory = EmailMessage

    def header_source_to_repr(self, sourcelines):
        return 'CUSTOM_HEADER_REPR: ' + ''.join(sourcelines).strip()

Parser(policy=MyCustomPolicy(max_line_length=1000)).parsestr('From: Foo Bar <user@example.com>\n'
                                                           'To: <someone_else@example.com>\n'
                                                           'Subject: Test message\n'
                                                           '\n'
                                                           'Body would go here\n')