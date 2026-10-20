# -*- coding: utf-8 -*-
{
    "name": "Numeric Field Widgets",
    "version": "17.0.1.0.2",
    "category": "Technical",
    "summary": "Strict numeric widgets for Integer and Float fields",
    "description": """
Numeric Field Widgets
=====================
Adds two reusable field widgets:
- numeric_integer
- numeric_float

Features:
- Zero is displayed as empty.
- With required=1, zero/empty is invalid and blocks saving.
- Non-numeric text is blocked while typing.
- Invalid clipboard content is rejected completely.
- Negative values can be allowed/blocked with the XML option allow_negative.
- Float parsing/formatting keeps Odoo's localization behavior.
    """,
    "author": "",
    "license": "LGPL-3",
    "depends": ["web"],
    "assets": {
        "web.assets_backend": [
            "numeric_field_widgets/static/src/js/numeric_field_utils.js",
            "numeric_field_widgets/static/src/js/record_patch.js",
            "numeric_field_widgets/static/src/js/integer_field.js",
            "numeric_field_widgets/static/src/js/float_field.js",
            "numeric_field_widgets/static/src/xml/numeric_field_templates.xml",
        ],
    },
    "installable": True,
    "application": False,
}
