from odoo import _, fields, models


class EaEntityVersionWizard(models.TransientModel):
    _name = "ea.entity.version.wizard"
    _description = "EA Entity Version Wizard"

    transition_id = fields.Many2one(
        "ea.transition",
        string="New Transition",
        required=True,
    )
    source_model = fields.Char(required=True)
    source_record_id = fields.Integer(required=True)

    def action_create_version(self):
        self.ensure_one()
        source_record = self.env[self.source_model].browse(self.source_record_id).exists()
        if not source_record:
            return {"type": "ir.actions.act_window_close"}

        source_record.ensure_one()
        current_base = source_record.entity_base_id
        root_base = source_record.version_parent_entity_id or current_base
        next_base = source_record.version_next_entity_id
        version_name = f"{root_base.name} - {self.transition_id.name}"

        new_record = source_record.copy(
            {
                "name": version_name,
                "transition_id": self.transition_id.id,
                "version_parent_entity_id": root_base.id,
                "version_previous_entity_id": current_base.id,
                "version_next_entity_id": next_base.id if next_base else False,
            }
        )

        source_record.version_next_entity_id = new_record.entity_base_id
        if next_base:
            next_base.version_previous_entity_id = new_record.entity_base_id

        return {
            "type": "ir.actions.act_window",
            "name": _("New Version"),
            "res_model": self.source_model,
            "res_id": new_record.id,
            "view_mode": "form",
            "target": "current",
        }
