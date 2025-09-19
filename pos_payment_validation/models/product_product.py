# -*- coding: utf-8 -*-

from odoo import models, api
from markupsafe import Markup


class ProductProduct(models.Model):
    _inherit = 'product.product'

    @api.model
    def get_product_availability_info(self, products, qty_limit_count):
        product_available = self.env['stock.quant'].search([
            ('product_id', 'in', products), ('location_id.usage', '=', 'internal'), ('quantity', '<=', qty_limit_count)
        ])
        if product_available:
            products = product_available.mapped('product_id').ids
            self._send_message_rop(products)
        return ' -\n'.join(p.product_id.name for p in product_available)

    def _send_message_rop(self, products_ids):
        products = self.env['product.product'].browse(products_ids)
        links = ", ".join(p._get_html_link() for p in products)
        msg = Markup(f"These products are under the Re-Order Point: {links}")
        partners = self.env.ref('stock.group_stock_manager').mapped('users.partner_id')
        for partner in partners:
            chan_info = self.env['discuss.channel'].channel_get(partners_to=[partner.id])
            channel = self.env['discuss.channel'].browse(chan_info['id'])
            channel.message_post(
                body=msg,
                message_type="comment",
                subtype_xmlid="mail.mt_comment",
            )
