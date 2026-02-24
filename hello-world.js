# Factory Pattern
# `import_module` acts as a factory method for creating module objects, similar to `EntryDynamic` returning an entry object, string, array, or promise.
# The `create_version_info_accessor` function is an explicit factory method.
version_accessor = create_version_info_accessor('patchlevel')
version, release = version_accessor.get_version_info()

# Dependency Injection
# `sys.path.append` injects paths for finding extensions.
# The `extensions` list directly injects the list of desired extensions into Sphinx, rather than Sphinx internally creating or discovering them.
extensions = [
    'audit_events',
    'availability',
    'c_annotations',
    'pyspecific',
    'sphinx.ext.coverage',
    'sphinx.ext.doctest',
]

# Strategy Pattern
# Various configuration variables allow choosing different strategies for Sphinx's behavior, similar to `ChunkLoading` providing different methods.
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

# Decorator Pattern
# Configuration options like `html_theme` and `ogp_custom_meta_tags` effectively decorate the output, similar to how `EntryStatic` can have additional properties.
html_theme = 'python_docs_theme' # The theme decorates the raw HTML output.
ogp_custom_meta_tags = ('<meta name="theme-color" content="#3776ab">',) # These meta tags decorate the HTML head.

# Module Pattern
# Python modules (`.py` files like `patchlevel`, `pyspecific`, and `conf.py` itself) encapsulate related functionality and data, similar to `Entry` encapsulating an entry point.
# For example, `pyspecific` encapsulates `SOURCE_URI`.
from pyspecific import SOURCE_URI
# The `conf.py` file itself encapsulates the entire Sphinx configuration.

# State Pattern
# `doctest_global_setup` and `warnings.simplefilter` configure specific states for parts of the build process, similar to `DevTool` defining tool types and configurations.
# This configures the global state for doctests
doctest_global_setup = '''
try:
    import _tkinter
except ImportError:
    _tkinter = None
import warnings
warnings.simplefilter('error')
del warnings
'''
# This sets a global state for how warnings are handled.
import warnings
warnings.simplefilter('error')

# The `is_deployment_preview` and `language_code` variables determine the "state" of the build environment, influencing subsequent behavior based on these conditions.
is_deployment_preview = os.getenv("READTHEDOCS_VERSION_TYPE") == "external"
language_code = None # Actual value set by command-line argument.