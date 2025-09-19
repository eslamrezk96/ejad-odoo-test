# -*- coding: utf-8 -*-
{
    'name': "POS Customer Validation",
    'description': """In the Second Page of POS -Payment
                        -Method Select screen
                        Make sure that you have selected
                        1- Customer
                        2- Customer with Phone
                        3- Customer with Phone started with +2""",
    'depends': ['point_of_sale'],
    'data': [
        'views/pos_config.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            '/pos_customer_validation/static/src/app/payment_screen/payment_screen.js',
        ],
    },

}
