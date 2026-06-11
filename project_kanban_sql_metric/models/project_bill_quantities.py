# -*- coding: utf-8 -*-

from odoo import fields, models


class ProjectBillQuantities(models.Model):
    _name = "project.bill.quantities"
    _description = "Project Bill Quantities"
    _order = "project_id, parent_id, id"

    name = fields.Char(required=True)
    project_id = fields.Many2one(
        "project.project",
        string="Project",
        required=True,
        ondelete="cascade",
        index=True,
    )
    parent_id = fields.Many2one(
        "project.bill.quantities",
        string="Parent Line",
        ondelete="cascade",
        index=True,
    )
    child_ids = fields.One2many(
        "project.bill.quantities",
        "parent_id",
        string="Child Lines",
    )
    is_parent = fields.Boolean(string="Is Parent", default=False, index=True)
    subtotal_untaxed = fields.Float(string="Subtotal Untaxed", default=0.0)
    item_status = fields.Selection(
        [
            ("draft", "Draft"),
            ("financial_approved", "Financial Approved"),
            ("done", "Done"),
        ],
        string="Item Status",
        default="draft",
        index=True,
    )
