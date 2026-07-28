{
    'name': 'Scanner Integration',
    'version': '17.0.1.0.0',
    'category': 'Tools',
    'summary': 'Scan documents into Odoo from a locally attached scanner',
    'description': """
Scan Documents into Odoo
=========================
Adds a reusable "Scan Document" action that talks to a small local helper
app (running on the user's Windows PC, see the companion scanner_helper
folder) which drives the attached scanner via NAPS2 (free, open source,
supports TWAIN and WIA drivers) and returns a PDF. The PDF is attached to
any Odoo record as a normal ir.attachment.

Setup required on every client machine that has a scanner:
1. Install NAPS2 (https://www.naps2.com) and create a scan profile named
   "Default" (or your own name) using its GUI.
2. Run the local helper app included in this module's scanner_helper
   folder (python app.py), or package it as a Windows service/exe.
3. Users click "Scan Document" from Odoo; the browser talks to the helper
   on http://127.0.0.1:5678.

To add scanning to a model: inherit `scanner.mixin` on that model and add
a button calling `action_open_scanner` to its form view (see
models/scanner_mixin.py for details).
    """,
    'author': 'Your Company',
    'website': '',
    'depends': ['base', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'wizard/scanner_wizard_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'scanner_integration/static/src/js/scan_capture_field.js',
            'scanner_integration/static/src/xml/scan_capture_field.xml',
        ],
    },
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}
