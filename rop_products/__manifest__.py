# -*- coding: utf-8 -*-
{
    'name': "ROP Products",
    'description': """Add new menu after products called “ROP” with
                        -submenu -Tree, Form, Kanban
                        1- ROP Products
                        2- Products > ROP
                        ================================================
    
                        Inside product.template Add checkbox field “Has ROP”
                        Depending on this filed show another field
                        integer called ROP Count Smart button inside the product.template show
                        the count of other Products that have its ROP count""",
    'depends': ['stock'],

    'data': [
        'views/product_template.xml',
        'views/rop_product_menu.xml',
    ],

}
