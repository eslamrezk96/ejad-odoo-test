from odoo import fields, models


class EaCybersecuritySecurityApparatus(models.Model):
    _name = "ea.cybersecurity.security.apparatus"
    _description = "EA Cybersecurity Security Apparatus"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaCybersecuritySecuritySoftware(models.Model):
    _name = "ea.cybersecurity.security.software"
    _description = "EA Cybersecurity Security Software"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaCybersecuritySecurityService(models.Model):
    _name = "ea.cybersecurity.security.service"
    _description = "EA Cybersecurity Security Service"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityTechnologyService(models.Model):
    _name = "ea.entity.technology.service"
    _description = "EA Entity Technology Service"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityApplication(models.Model):
    _name = "ea.entity.application"
    _description = "EA Entity Application"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityStep(models.Model):
    _name = "ea.entity.step"
    _description = "EA Entity Step"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityStage(models.Model):
    _name = "ea.entity.stage"
    _description = "EA Entity Stage"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityOrganizationUnit(models.Model):
    _name = "ea.entity.organization.unit"
    _description = "EA Entity Organization Unit"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityBusinessCapability(models.Model):
    _name = "ea.entity.business.capability"
    _description = "EA Entity Business Capability"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityBusinessService(models.Model):
    _name = "ea.entity.business.service"
    _description = "EA Entity Business Service"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityDigitalTransformationGoals(models.Model):
    _name = "ea.entity.digital.transformation.goals"
    _description = "EA Entity Digital Transformation Goals"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityEaObjective(models.Model):
    _name = "ea.entity.ea.objective"
    _description = "EA Entity EA Objective"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityGap(models.Model):
    _name = "ea.entity.gap"
    _description = "EA Entity Gap"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )
    projects_ids = fields.Many2many(
        "project.project",
        "ea_gap_project_rel",
        "gap_id",
        "project_id",
        string="Projects",
    )
