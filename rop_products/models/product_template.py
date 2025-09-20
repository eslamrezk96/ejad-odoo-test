# -*- coding: utf-8 -*-

from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    has_rop = fields.Boolean("Has ROP")
    rop_count = fields.Integer("ROP Count")

    def action_get_rop_products(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'ROP Products',
            'res_model': 'product.template',
            'views': [[False, 'list'], [False, 'form']],
            'domain': [('rop_count', '=', self.rop_count), ('id', '!=', self.id)],
        }
