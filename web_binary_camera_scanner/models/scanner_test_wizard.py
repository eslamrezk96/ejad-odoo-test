from odoo import fields, models


class ScannerTestWizard(models.TransientModel):
    _name = "scanner.test.wizard"
    _description = "Scanner Gateway Test"

    document = fields.Binary(string="Document", attachment=False)
    document_filename = fields.Char(string="Filename")
