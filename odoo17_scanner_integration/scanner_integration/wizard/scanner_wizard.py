# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class ScannerWizard(models.TransientModel):
    _name = 'scanner.wizard'
    _description = 'Scan Document Wizard'

    res_model = fields.Char(required=True, string='Target model')
    res_id = fields.Integer(required=True, string='Target record ID')

    # Filled in by the JS widget after a successful scan.
    scan_data = fields.Binary(string='Scanned file')
    scan_filename = fields.Char(string='File name', default='scan.pdf')

    def action_attach(self):
        self.ensure_one()
        if not self.scan_data:
            raise UserError(_('Please scan a document before attaching it.'))

        self.env['ir.attachment'].create({
            'name': self.scan_filename or 'scan.pdf',
            'datas': self.scan_data,
            'res_model': self.res_model,
            'res_id': self.res_id,
            'mimetype': 'application/pdf',
        })
        return {'type': 'ir.actions.act_window_close'}
