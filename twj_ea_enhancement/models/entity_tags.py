from odoo import fields, models


class EntityTags(models.Model):
    _name = "ea.entity.tags"
    _description = "Entity Tags"
    _order = "sequence, id"

    name = fields.Char(required=True, translate=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
