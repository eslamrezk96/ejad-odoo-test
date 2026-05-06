from odoo import fields, models


class EaTransition(models.Model):
    _name = "ea.transition"
    _description = "EA Transition"
    _order = "start_date, id"

    name = fields.Char(required=True, translate=True)
    start_date = fields.Date()
    end_date = fields.Date()
    project_id = fields.Many2one(
        "project.project",
        string="Project",
        ondelete="set null",
    )
