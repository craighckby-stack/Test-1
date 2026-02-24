# Dependency Injection
# Extensions are provided to Sphinx for use. The conf.py acts as the configuration
# for what dependencies (extensions) Sphinx should load.
import os
import sys
from importlib import import_module
from importlib.util import find_spec

# Make custom extensions available for Sphinx to "inject"
sys.path.append(os.path.abspath('tools/extensions'))
sys.path.append(os.path.abspath('includes'))

# Direct import of a specific dependency from an extension
from pyspecific import SOURCE_URI

# List of extensions to be injected into Sphinx
extensions = [
    'audit_events',
    'availability',
    'c_annotations',
    'pyspecific',
    'sphinx.ext.coverage',
    'sphinx.ext.doctest',
]

# Dynamically checking for optional extensions to append
_OPTIONAL_EXTENSIONS = (
    'notfound.extension',
    'sphinxext.opengraph',
)
for optional_ext in _OPTIONAL_EXTENSIONS:
    try:
        if find_spec(optional_ext) is not None:
            extensions.append(optional_ext)
    except (ImportError, ValueError):
        pass
del _OPTIONAL_EXTENSIONS

# Dynamically loading a module to get version info - `patchlevel` is a dependency
version, release = import_module('patchlevel').get_version_info()


# Service Locator
# Using `import_module` and `find_spec` to locate and load modules/services.
# `os.getenv` is used to locate environment configuration services.
# Locating and importing a module as a service provider
patchlevel_module_service = import_module('patchlevel')
version_info = patchlevel_module_service.get_version_info()

# Locating module specifications (services for loading modules)
if find_spec('notfound.extension') is not None:
    # Found the 'notfound.extension' service
    pass

# Locating configuration from environment variables (an external service)
is_deployment_preview = os.getenv("READTHEDOCS_VERSION_TYPE") == "external"
repository_url = os.getenv("READTHEDOCS_GIT_CLONE_URL", "")

# Accessing command-line arguments to locate language setting
language_code = None
for arg in sys.argv:
    if arg.startswith('language='):
        language_code = arg.split('=', 1)[1]


# Facade
# Configuration options act as a facade, providing a simplified interface to complex underlying systems.
# Project metadata as a facade
project = 'Python'
copyright = "2001 Python Software Foundation"

# HTML theme options provide a simplified interface to configure the theme's complex behavior
html_theme_options = {
    'collapsiblesidebar': True,
    'issues_url': '/bugs.html',
    'root_include_title': False,
}

# The `nitpick_ignore` list provides a facade to ignore specific warnings
# without needing to handle each warning type individually in detailed logic.
nitpick_ignore = [
    ('c:func', 'malloc'),
    ('c:type', 'size_t'),
    ('envvar', 'PATH'),
]

# `rst_epilog` provides a simple way to inject common reStructuredText content.
rst_epilog = f"""
.. |python_version_literal| replace:: ``Python {version}``
"""


# Factory Method
# `import_module` acts as a factory method for creating module objects.
# The `conf.py` uses this factory.
def create_version_info_accessor(module_name: str):
    """Factory method to get an object that can provide version information."""
    module = import_module(module_name)
    return module

version_accessor = create_version_info_accessor('patchlevel')
version, release = version_accessor.get_version_info()


# Strategy
# Various configuration variables allow choosing different strategies for Sphinx's behavior.
# HTML rendering strategy
html_theme = 'python_docs_theme'

# LaTeX engine compilation strategy
latex_engine = 'xelatex'

# Code highlighting strategy
highlight_language = 'python3'

# Date formatting strategy
today_fmt = '%B %d, %Y'

# Smartquotes exclusion strategy
smartquotes_excludes = {
    'languages': ['ja', 'fr'],
    'builders': ['man', 'text'],
}

# Sidebar layout strategy
html_sidebars = {
    '**': ['localtoc.html', 'relations.html'],
    'index': ['indexsidebar.html'],
}


# Command
# Assignments and method calls act as commands to configure Sphinx or modify the environment.
# Command to modify the Python path
sys.path.append(os.path.abspath('temporary_tools'))

# Command to set a warning filter
import warnings
warnings.simplefilter('error')

# Command to add an extension to the list
extensions.append('my_new_command_extension')

# Command to add a tag (assuming 'tags' object from Sphinx environment)
class MockTags:
    def __init__(self):
        self._tags = set()
    def add(self, tag):
        self._tags.add(tag)
tags = MockTags()
tags.add('translation')


# Callback
# `doctest_global_setup` provides a string of code that Sphinx will execute as a callback
# at a specific point during the doctest phase.
doctest_global_setup = '''
try:
    import _tkinter
except ImportError:
    _tkinter = None
import warnings
warnings.simplefilter('error')
del warnings
'''

# Example of a conceptual callback function if Sphinx were to invoke it
# (not directly registered here, but illustrates the concept)
def my_custom_event_handler(app, env, docname):
    print(f"Sphinx processing document: {docname}")

# In a real scenario, this would be registered with app.connect(...)
# e.g., app.connect('source-read', my_custom_event_handler)


# Chain of Responsibility
# The `extensions` list, while not strictly sequential processing of content,
# defines a collection of components that Sphinx will load. These extensions
# often hook into various build stages, forming a "chain" of responsibilities
# where different extensions handle different aspects of the documentation process.
extensions = [
    'audit_events',         # Might handle specific audit event directives
    'c_annotations',        # Might process C annotations
    'pyspecific',           # Handles Python-specific roles/directives
    'sphinx.ext.coverage',  # Collects coverage data
    # Each extension has a responsibility in the overall build chain.
]


# Decorator
# The `conf.py` itself doesn't typically implement the Decorator pattern directly
# in the Python sense (e.g., using `@`). Instead, it *configures* how other
# components (like themes or extensions) *decorate* the output or behavior of Sphinx.
# For example, an `html_theme` decorates the raw HTML output with styling and structure.
html_theme = 'python_docs_theme' # The theme itself is a decorator for the rendered content.

# `ogp_custom_meta_tags` can be seen as "decorating" the HTML head with additional meta information.
ogp_custom_meta_tags = ('<meta name="theme-color" content="#3776ab">',)