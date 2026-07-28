from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    scanner_api_token = fields.Char(
        string="Gateway API Token",
        config_parameter="web_binary_camera_scanner.api_token",
    )
    scanner_max_upload_mb = fields.Integer(
        string="Maximum Scan Upload (MB)",
        config_parameter="web_binary_camera_scanner.max_upload_mb",
        default=15,
    )
