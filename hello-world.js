* Model-View-Controller (MVC) pattern:
  * Controller: The `main` method acts as the controller, parsing command-line arguments (`ArgumentParser`), and coordinating the creation and delivery/storage of the email message based on user input.
  * Model: The `EmailMessage` object (`msg`) serves as the model, encapsulating the entire state and content of the email (headers, attachments, preamble).
  * View: The two branches for handling the final message (`if args.output: ... else: ...`) represent different views. Writing the message to a file (`fp.write(msg.as_bytes(policy=SMTP))`) is one view, presenting the raw message output. Sending the message via SMTP (`s.send_message(msg)`) is another view, delivering the message to the mail system.
* Factory pattern:
  * The `mimetypes.guess_file_type(path)` function acts as a factory method. Given a file path, it encapsulates the logic to determine (or "create" a representation of) its content type and encoding, shielding the client from the details of this inference process.
* Strategy pattern:
  * The code employs a strategy pattern for the final disposition of the `EmailMessage`. Based on the `--output` argument, it selects between two concrete strategies:
    1.  Writing the email bytes to a specified file (`if args.output:` block).
    2.  Sending the email through an SMTP server (`else:` block).
  * This allows the `main` function to define the overall algorithm, with the specific "send" or "store" behavior being pluggable.
* Observer pattern:
  * The `argparse` module, specifically the `parser.parse_args()`, can be seen as an observer. It "observes" the command-line input provided by the user and then "notifies" the rest of the `main` function by providing a populated `args` object. The `main` function then reacts to the state of the `args` object.
* Template method pattern:
  * The `main` function defines a template for the email sending process: initialize the message, set headers, iterate through a directory to add attachments, and finally, either send or store the message. This high-level algorithm remains consistent, while specific steps like how attachments are determined (`mimetypes.guess_file_type`) or how the message is ultimately handled (`if args.output: ... else: ...`) provide the concrete implementations for certain steps within the template.