{
    "name": "Binary Camera & Scanner",
    "version": "17.0.1.2.0",
    "summary": "Upload, camera capture, and scanner jobs for binary fields",
    "category": "Technical",
    "author": "Custom",
    "license": "LGPL-3",
    "depends": ["base_setup", "web", "bus"],
    "data": [
        "security/scanner_security.xml",
        "security/ir.model.access.csv",
        "data/scanner_job_sequence.xml",
        "views/scanner_job_views.xml",
        "views/scanner_test_wizard_views.xml",
        "views/res_config_settings_views.xml"
    ],
    "assets": {
        "web.assets_backend": [
            "web_binary_camera_scanner/static/src/js/camera_dialog.js",
            "web_binary_camera_scanner/static/src/js/scanner_dialog.js",
            "web_binary_camera_scanner/static/src/js/binary_camera_scanner_field.js",
            "web_binary_camera_scanner/static/src/xml/camera_dialog.xml",
            "web_binary_camera_scanner/static/src/xml/scanner_dialog.xml",
            "web_binary_camera_scanner/static/src/xml/binary_camera_scanner_field.xml",
            "web_binary_camera_scanner/static/src/scss/binary_camera_scanner.scss"
        ]
    },
    "application": True,
    "installable": True
}
