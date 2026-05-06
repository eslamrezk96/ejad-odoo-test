from odoo import fields, models


class EaEntityBase(models.Model):
    _name = "ea.entity.base"
    _description = "EA Entity Base"
    _order = "name, id"

    name = fields.Char(required=True, translate=True)
    active = fields.Boolean(default=True)
    tags_ids = fields.Many2many(
        "ea.entity.tags",
        string="Tags",
    )
    transition_id = fields.Many2one(
        "ea.transition",
        string="Transition",
        ondelete="set null",
    )
    gap_ids = fields.Many2many(
        "ea.entity.gap",
        "ea_entity_base_gap_rel",
        "entity_base_id",
        "gap_id",
        string="Gaps",
    )
    change_type = fields.Selection(
        [
            ("none", "Idea"),
            ("new", "Planned"),
            ("change", "Build"),
            ("active", "Active"),
            ("maintain", "Maintain"),
            ("optimize", "Optimize"),
            ("cancel", "Sunset"),
            ("old", "Retired"),
        ],
        string="Change Type",
        default="none",
    )
