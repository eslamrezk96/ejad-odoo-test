# -*- coding: utf-8 -*-
{
    "name": "Camera Binary Widget",
    "summary": "Add camera capture support to Binary fields in Odoo 17",
    "version": "17.0.1.1.0",
    "category": "Tools",
    "author": "Custom Development",
    "license": "LGPL-3",
    "depends": ["web"],
    "assets": {
        "web.assets_backend": [
            "camera_binary_widget/static/src/fields/camera_binary/camera_binary_field.js",
            "camera_binary_widget/static/src/fields/camera_binary/camera_binary_field.xml",
            "camera_binary_widget/static/src/fields/camera_binary/camera_binary_field.scss",
        ],
    },
    "installable": True,
    "application": False,
}
