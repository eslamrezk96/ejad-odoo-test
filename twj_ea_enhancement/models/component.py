from odoo import fields, models


class EaComponent(models.Model):
    _name = "ea.component"
    _description = "EA Component"
    _order = "sequence, id"

    name = fields.Char(required=True, translate=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    layer_id = fields.Many2one(
        "ea.layer",
        required=True,
        ondelete="cascade",
        string="Layer",
    )
    data_model_id = fields.Many2one(
        "ir.model",
        string="Model",
    )
