* Factory Pattern:
    - `email.utils.make_msgid()` acts as a factory method, encapsulating the logic for creating unique message IDs.
* Composite Pattern:
    - The `EmailMessage` class, by allowing the addition of different parts (text, HTML, related images) into a hierarchical structure (`multipart/alternative`, `add_related`), enables clients to treat individual parts and compositions of parts uniformly.
* Bridge Pattern:
    - The `multipart/alternative` structure decouples the abstract message content from its specific implementations (plain text and HTML), allowing these representations to vary independently.
* Template Pattern:
    - The HTML content uses string formatting (`.format(asparagus_cid=...)`) to insert dynamic data into a predefined string structure, functioning as a basic template.
* Builder Pattern:
    - The `EmailMessage` class provides a step-by-step API (`msg['Subject'] = ...`, `msg.set_content(...)`, `msg.add_alternative(...)`, `add_related(...)`) for constructing a complex email object, separating its construction from its final representation.