from odoo import fields, models


class EaEntityType(models.Model):
    _name = "ea.entity.type"
    _description = "EA Entity Type"
    _order = "name, id"

    name = fields.Char(required=True, translate=True)
    active = fields.Boolean(default=True)
