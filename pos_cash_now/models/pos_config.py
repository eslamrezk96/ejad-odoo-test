# -*- coding: utf-8 -*-

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    def _get_default_payment_method(self):
        return self.env['pos.payment.method'].search([('is_cash_count', '=', True)], limit=1).id

    enable_cash_now = fields.Boolean(string='Enable Cash Now', default=True)
    default_pos_partner_id = fields.Many2one(comodel_name='res.partner', default=lambda self: self.env.ref('base.user_admin').partner_id.id)
    default_payment_method_id = fields.Many2one(comodel_name='pos.payment.method', default=_get_default_payment_method)


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    enable_cash_now = fields.Boolean(related="pos_config_id.enable_cash_now", readonly=False)
    default_pos_partner_id = fields.Many2one(related="pos_config_id.default_pos_partner_id", readonly=False)
    default_payment_method_id = fields.Many2one(related="pos_config_id.default_payment_method_id", readonly=False)
