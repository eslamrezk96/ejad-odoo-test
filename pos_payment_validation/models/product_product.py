# -*- coding: utf-8 -*-

from odoo import models, api


class ProductProduct(models.Model):
    _inherit = 'product.product'

    @api.model
    def get_product_availability_info(self, products, qty_limit_count):
        product_available = self.env['stock.quant'].search([
            ('product_id', 'in', products), ('location_id.usage', '=', 'internal'), ('quantity', '<=', qty_limit_count)
        ])
        product_label = []
        for product in product_available:
            product_label.append(product.product_id.name)
        return ' -\n'.join(product_label)