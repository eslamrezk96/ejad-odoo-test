# -*- coding: utf-8 -*-
from odoo import models


class ScannerMixin(models.AbstractModel):
    """Inherit this on any model to add a 'Scan Document' action.

    Example (in your own module):

        class AccountMove(models.Model):
            _name = 'account.move'
            _inherit = ['account.move', 'scanner.mixin']

    Then add a button to that model's form view:

        <button name="action_open_scanner" type="object"
                string="Scan Document" class="oe_stat_button" icon="fa-print"/>
    """
    _name = 'scanner.mixin'
    _description = 'Adds a Scan Document action to a model'

    def action_open_scanner(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Scan Document',
            'res_model': 'scanner.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_res_model': self._name,
                'default_res_id': self.id,
            },
        }
