# -*- coding: utf-8 -*-
{
    'name': "POS Instance Payment",
    'description': """In the product page make a button
                    to make instance payment with default method and customer and print the pos invoice""",
    'depends': ['point_of_sale', 'stock',],
    'data': [
        'views/pos_config.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            '/pos_instance_payment/static/src/app/**/*',
        ],
    },

}
