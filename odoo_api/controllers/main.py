# -*- coding: utf-8 -*-

from odoo import http, fields
from odoo.http import request


class PosOrderApi(http.Controller):

    @http.route('/api/orders', type='http', auth='user', methods=['GET'], csrf=False)
    def get_pos_orders(self, **kwargs):
        start_date = kwargs.get('start_date')
        end_date = kwargs.get('end_date')
        if not start_date or not end_date:
            return request.make_json_response({'error': 'start_date and end_date parameters are required.'})

        orders = request.env['pos.order'].sudo().search([
            ('date_order', '>=', start_date),
            ('date_order', '<=', end_date)
        ])

        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'name': order.name,
                'date_order': fields.Datetime.to_string(order.date_order),
                'partner_id': order.partner_id.name,
                'amount_total': order.amount_total,
                'state': order.state,
            })

        return request.make_json_response(orders_data, status=200)


class ROPProductsAPI(http.Controller):

    @http.route('/api/products/with-rop', type='http', auth='user', methods=['GET'], csrf=False)
    def get_rop_products(self):
        products = request.env['product.template'].sudo().search([('has_rop', '=', True)])

        products_data = []
        for product in products:
            products_data.append({
                'id': product.id,
                'name': product.name,
                'rop_count': product.rop_count,
            })

        return request.make_json_response(products_data, status=200)


class UpdateROPCount(http.Controller):

    @http.route('/api/products/<int:product_id>/rop', type='http', auth='user', methods=['PUT'], csrf=False)
    def update_rop_count(self, product_id, **kwargs):
        """Add A ROP Count for specific Product"""
        rop_count = kwargs.get('rop_count')
        if rop_count is None:
            return request.make_json_response({'error': 'rop_count parameter is required.'}, status=400)

        product = request.env['product.template'].sudo().browse(int(product_id))
        if not product.exists():
            return request.make_json_response({'error': 'Product not found.'}, status=404)

        product.write({'rop_count': rop_count, 'has_rop': True})

        return request.make_json_response({'message': 'ROP count updated successfully.'}, status=200)


class POSSessionOrders(http.Controller):

    @http.route('/api/pos/sessions/<int:session_id>/orders', type='http', auth='user', methods=['GET'], csrf=False)
    def get_pos_session_orders(self, session_id):
        """Get all Orders inside a POS Session"""

        if not session_id:
            return request.make_json_response({'error': 'session_id is not found'}, status=400)

        orders = request.env['pos.order'].sudo().search([('session_id', '=', session_id)])
        if not orders:
            return request.make_json_response({'warning': 'There is no Orders for this session'}, status=400)

        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'name': order.name,
                'date_order': fields.Datetime.to_string(order.date_order),
                'partner_id': order.partner_id.name,
                'amount_total': order.amount_total,
                'state': order.state,
            })

        return request.make_json_response(orders_data, status=200)
