from odoo import fields, models


class ProjectProject(models.Model):
    _inherit = "project.project"

    gap_ids = fields.Many2many(
        "ea.entity.gap",
        "ea_gap_project_rel",
        "project_id",
        "gap_id",
        string="Gaps",
    )
