# -*- coding: utf-8 -*-
{
    'name': "POS Payment Validation",
    'description': """ - Make a validation on Payment button in
                                POS products screen to check if the
                                Product quantity > 5 unit in the stock else
                                return message with “This product under of the Re-Order Point measure

                                - Send notification to
                                the warehouses admin to check the ROP of
                                the product less than 5""",
    'depends': ['point_of_sale', 'stock', 'mail', 'pos_epson_printer'],
    'data': [
        'views/pos_config.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            '/pos_payment_validation/static/src/app/models/models.js',
        ],
    },

}
