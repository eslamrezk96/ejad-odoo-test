from odoo import _, models


class RoadmapReportButtonMixin(models.AbstractModel):
    _name = "ea.roadmap.report.button.mixin"
    _description = "Roadmap Report Button Mixin"

    def _get_roadmap_initial_layer_ids(self):
        self.ensure_one()
        component = self.env["ea.component"].sudo().search(
            [
                ("data_model_id.model", "=", self._name),
            ],
            order="sequence, id",
            limit=1,
        )
        return component.layer_id.ids

    def _get_roadmap_initial_tag_ids(self):
        self.ensure_one()
        return self.tags_ids.ids if "tags_ids" in self._fields else []

    def action_open_roadmap_report(self):
        self.ensure_one()
        return {
            "type": "ir.actions.client",
            "name": "Building Block Roadmap Report",
            "tag": "twj_ea_enhancement.client_action",
            "params": {
                "source_model": self._name,
                "source_record_id": self.id,
                "initial_layer_ids": self._get_roadmap_initial_layer_ids(),
                "initial_tag_ids": self._get_roadmap_initial_tag_ids(),
            },
        }

    def action_open_new_version_wizard(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Create New Version"),
            "res_model": "ea.entity.version.wizard",
            "view_mode": "form",
            "target": "new",
            "context": {
                "default_source_model": self._name,
                "default_source_record_id": self.id,
            },
        }


class EaEntityApplicationRoadmapButton(models.Model):
    _name = "ea.entity.application"
    _inherit = ["ea.entity.application", "ea.roadmap.report.button.mixin"]


class EaEntityTechnologyServiceRoadmapButton(models.Model):
    _name = "ea.entity.technology.service"
    _inherit = ["ea.entity.technology.service", "ea.roadmap.report.button.mixin"]


class EaEntityStepRoadmapButton(models.Model):
    _name = "ea.entity.step"
    _inherit = ["ea.entity.step", "ea.roadmap.report.button.mixin"]


class EaEntityStageRoadmapButton(models.Model):
    _name = "ea.entity.stage"
    _inherit = ["ea.entity.stage", "ea.roadmap.report.button.mixin"]


class EaEntityOrganizationUnitRoadmapButton(models.Model):
    _name = "ea.entity.organization.unit"
    _inherit = ["ea.entity.organization.unit", "ea.roadmap.report.button.mixin"]


class EaEntityBusinessCapabilityRoadmapButton(models.Model):
    _name = "ea.entity.business.capability"
    _inherit = ["ea.entity.business.capability", "ea.roadmap.report.button.mixin"]


class EaEntityBusinessServiceRoadmapButton(models.Model):
    _name = "ea.entity.business.service"
    _inherit = ["ea.entity.business.service", "ea.roadmap.report.button.mixin"]


class EaEntityDigitalTransformationGoalsRoadmapButton(models.Model):
    _name = "ea.entity.digital.transformation.goals"
    _inherit = ["ea.entity.digital.transformation.goals", "ea.roadmap.report.button.mixin"]


class EaEntityEaObjectiveRoadmapButton(models.Model):
    _name = "ea.entity.ea.objective"
    _inherit = ["ea.entity.ea.objective", "ea.roadmap.report.button.mixin"]


class EaCybersecuritySecurityApparatusRoadmapButton(models.Model):
    _name = "ea.cybersecurity.security.apparatus"
    _inherit = ["ea.cybersecurity.security.apparatus", "ea.roadmap.report.button.mixin"]


class EaCybersecuritySecuritySoftwareRoadmapButton(models.Model):
    _name = "ea.cybersecurity.security.software"
    _inherit = ["ea.cybersecurity.security.software", "ea.roadmap.report.button.mixin"]


class EaCybersecuritySecurityServiceRoadmapButton(models.Model):
    _name = "ea.cybersecurity.security.service"
    _inherit = ["ea.cybersecurity.security.service", "ea.roadmap.report.button.mixin"]
