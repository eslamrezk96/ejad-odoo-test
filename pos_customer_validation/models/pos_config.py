# -*- coding: utf-8 -*-

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    customer_restriction = fields.Boolean(string='Customer Restriction', default=True)


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    customer_restriction = fields.Boolean(related="pos_config_id.customer_restriction", readonly=False)
