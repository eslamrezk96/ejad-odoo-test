from odoo import fields, models


class RoadmapLayer(models.Model):
    _name = "ea.layer"
    _description = "EA Layer"
    _order = "sequence, id"

    name = fields.Char(required=True, translate=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    component_ids = fields.One2many(
        "ea.component",
        "layer_id",
        string="Components",
    )
