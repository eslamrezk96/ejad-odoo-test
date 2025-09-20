# -*- coding: utf-8 -*-
{
    'name': "POS Cash Now",
    'description': """In the product page make a button “Cash now”
    to make instance payment with cash method
    with customer admin by default and print the
    pos invoice""",
    'depends': ['point_of_sale', 'stock',],
    'data': [
        'views/pos_config.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            '/pos_cash_now/static/src/app/**/*',
        ],
    },

}
