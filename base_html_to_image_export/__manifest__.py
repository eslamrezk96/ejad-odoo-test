{
    "name": "Base HTML To Image Export",
    "version": "17.0.1.0.0",
    "summary": "Light client-side export of QWeb HTML blocks to PNG, JPEG, or SVG",
    "depends": ["web"],
    "assets": {
        "web.assets_backend": [
            "base_html_to_image_export/static/src/js/local.js",
            "base_html_to_image_export/static/src/js/html_to_image_export.js",
            "base_html_to_image_export/static/src/scss/html_to_image_export.scss",
        ],
        "web.report_assets_common": [
            "base_html_to_image_export/static/src/js/local.js",
            "base_html_to_image_export/static/src/js/html_to_image_export.js",
            "base_html_to_image_export/static/src/scss/html_to_image_export.scss",
        ],
    },
    "license": "LGPL-3",
    "installable": True,
    "application": False,
}