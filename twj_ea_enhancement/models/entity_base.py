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
    version_parent_entity_id = fields.Many2one(
        "ea.entity.base",
        string="Version Parent",
        ondelete="set null",
        copy=False,
    )
    version_previous_entity_id = fields.Many2one(
        "ea.entity.base",
        string="Previous Version",
        ondelete="set null",
        copy=False,
    )
    version_next_entity_id = fields.Many2one(
        "ea.entity.base",
        string="Next Version",
        ondelete="set null",
        copy=False,
    )
    version_entity_ids = fields.One2many(
        "ea.entity.base",
        "version_parent_entity_id",
        string="Versions",
        copy=False,
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
