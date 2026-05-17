{
    "name": "Twj EA Enhancement",
    "version": "17.0.1.1.0",
    "category": "Reporting",
    "summary": "Interactive Building Block Roadmap Report using OWL and AJAX",
    "description": """
Building Block Roadmap Report
=============================

Initial version:
- Backend menu item
- OWL client action
- Load Layers from Python controller
- Automatic AJAX/RPC search when the Layer filter changes
- Temporary fake result lines for testing the frontend/backend flow

This version intentionally does not yet read from ea.entity.* models.
""",
    "author": "Custom",
    "license": "LGPL-3",
    "depends": ["web", "project", "base_html_to_image_export"],
    "data": [
        "security/ir.model.access.csv",
        "data/roadmap_layer_data.xml",
        "data/ea_transition_gap_data.xml",
        "data/ea_entity_tag_data.xml",
        "data/ea_component_data.xml",
        "views/roadmap_report_menu.xml",
        "views/ea_entity_version_wizard_views.xml",
        "views/ea_manual_management_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "twj_ea_enhancement/static/src/js/roadmap_report.js",
            "twj_ea_enhancement/static/src/js/value_stream_map.js",
            "twj_ea_enhancement/static/src/xml/roadmap_report.xml",
            "twj_ea_enhancement/static/src/xml/value_stream_map.xml",
            "twj_ea_enhancement/static/src/scss/roadmap_report.scss",
            "twj_ea_enhancement/static/src/scss/value_stream_map.scss",
            "twj_ea_enhancement/static/src/scss/change_type_classes.scss",
        ],
    },
    "installable": True,
    "application": True,
}
