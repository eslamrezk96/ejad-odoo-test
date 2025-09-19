# -*- coding: utf-8 -*-

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    qty_restriction = fields.Boolean(string='Qty Restriction', default=True)
    qty_limit_count = fields.Float(string='Qty Limit Count', default=5.0)


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    qty_restriction = fields.Boolean(related="pos_config_id.qty_restriction", readonly=False)
    qty_limit_count = fields.Float(related="pos_config_id.qty_limit_count", readonly=False)
