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
    _parent_name = "parent_id"
    _parent_store = True

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )
    parent_id = fields.Many2one(
        "ea.entity.organization.unit",
        string="Parent Organization Unit",
        index=True,
        ondelete="restrict",
    )
    parent_path = fields.Char(index=True)


class EaEntityBusinessCapability(models.Model):
    _name = "ea.entity.business.capability"
    _description = "EA Entity Business Capability"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )
    business_service_ids = fields.Many2many(
        "ea.entity.business.service",
        "business_service_capability_rel",
        "capability_id",
        "business_service_id",
        string="Business Services",
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
    application_ids = fields.Many2many(
        "ea.entity.application",
        "service_application_rel",
        "service_id",
        "application_id",
        string="Applications",
    )
    technology_service_ids = fields.Many2many(
        "ea.entity.technology.service",
        "business_service_technology_service_rel",
        "business_service_id",
        "technology_service_id",
        string="Technology Services",
    )
    step_ids = fields.Many2many(
        "ea.entity.step",
        "business_service_step_rel",
        "business_service_id",
        "step_id",
        string="Steps",
    )
    stage_ids = fields.Many2many(
        "ea.entity.stage",
        "business_service_stage_rel",
        "business_service_id",
        "stage_id",
        string="Stages",
    )
    organization_unit_ids = fields.Many2many(
        "ea.entity.organization.unit",
        "business_service_organization_unit_rel",
        "business_service_id",
        "organization_unit_id",
        string="Organization Units",
    )
    business_capability_ids = fields.Many2many(
        "ea.entity.business.capability",
        "business_service_capability_rel",
        "business_service_id",
        "capability_id",
        string="Business Capabilities",
    )
    process_group_ids = fields.Many2many(
        "ea.entity.process.group",
        "business_service_process_group_rel",
        "business_service_id",
        "process_group_id",
        string="Process Groups",
    )
    value_stream_ids = fields.Many2many(
        "ea.entity.value.stream",
        "business_service_value_stream_rel",
        "business_service_id",
        "value_stream_id",
        string="Value Streams",
    )
    digital_transformation_goal_ids = fields.Many2many(
        "ea.entity.digital.transformation.goals",
        "business_service_digital_goal_rel",
        "business_service_id",
        "goal_id",
        string="Digital Transformation Goals",
    )
    strategy_ids = fields.Many2many(
        "ea.entity.strategy",
        "business_service_strategy_rel",
        "business_service_id",
        "strategy_id",
        string="Strategies",
    )
    ea_objective_ids = fields.Many2many(
        "ea.entity.ea.objective",
        "business_service_ea_objective_rel",
        "business_service_id",
        "objective_id",
        string="EA Objectives",
    )

class EaEntityProcessGroup(models.Model):
    _name = "ea.entity.process.group"
    _description = "EA Entity Process Group"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityValueStream(models.Model):
    _name = "ea.entity.value.stream"
    _description = "EA Entity Value Stream"
    _order = "sequence, id"

    sequence = fields.Integer(string="Sequence", default=10)
    name = fields.Char(required=True, translate=True)
    code = fields.Char(string="Code", translate=True)
    value_stream_stages_ids = fields.One2many(
        "ea.entity.value.stream.stages",
        "value_stream_id",
        string="Stages",
    )
    value_stream_stages_count = fields.Integer(
        string="Stages Count",
        compute="_compute_value_stream_stages_count",
    )
    active = fields.Boolean(default=True)

    def _compute_value_stream_stages_count(self):
        for record in self:
            record.value_stream_stages_count = len(record.value_stream_stages_ids)

    def action_open_value_stream_stages(self):
        self.ensure_one()
        return {
            "type": "ir.actions.client",
            "name": "Value Stream Map",
            "tag": "twj_ea_enhancement.value_stream_map_client_action",
            "params": {
                "source_record_id": self.id,
            },
        }


class EaEntityValueStreamStages(models.Model):
    _name = "ea.entity.value.stream.stages"
    _description = "Value Stream Stages"
    _order = "sequence, id"

    value_stream_id = fields.Many2one("ea.entity.value.stream", string="Value Stream")
    sequence = fields.Integer(string="Sequence", default=10)
    name = fields.Char(string="Name", translate=True, required=True)
    code = fields.Char(string="Code", translate=True)
    process_group_ids = fields.Many2many(
        "ea.entity.process.group",
        string="Process Group",
    )
    organization_unit_ids = fields.Many2many(
        "ea.entity.organization.unit",
        string="Stage Owner",
    )
    capabilities_ids = fields.Many2many(
        "ea.entity.business.capability",
        string="Capabilities",
    )
    description = fields.Text(string="Description", translate=True, copy=False)


class EaEntityDigitalTransformationGoals(models.Model):
    _name = "ea.entity.digital.transformation.goals"
    _description = "EA Entity Digital Transformation Goals"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )


class EaEntityStrategy(models.Model):
    _name = "ea.entity.strategy"
    _description = "EA Entity Strategy"
    _inherits = {"ea.entity.base": "entity_base_id"}

    entity_base_id = fields.Many2one(
        "ea.entity.base",
        required=True,
        ondelete="cascade",
    )
    vision = fields.Text(string="Vision", translate=True)
    mission = fields.Text(string="Mission", translate=True)
    pillars_ids = fields.One2many(
        "ea.entity.strategy.pillar",
        "strategy_id",
        string="Strategic Pillars",
    )

    def action_open_strategy_house(self):
        self.ensure_one()
        return {
            "type": "ir.actions.client",
            "name": "Strategy House",
            "tag": "twj_ea_enhancement.strategy_house_client_action",
            "params": {
                "strategy_id": self.id,
            },
        }


class EaEntityStrategyPillar(models.Model):
    _name = "ea.entity.strategy.pillar"
    _description = "EA Entity Strategy Pillar"
    _order = "sequence, name, id"

    name = fields.Char(string="Name", translate=True, required=True)
    sequence = fields.Integer(string="Sequence", default=10)
    strategy_id = fields.Many2one(
        "ea.entity.strategy",
        string="Strategy",
        required=True,
        ondelete="cascade",
    )
    strategic_goal_ids = fields.Many2many(
        "ea.entity.digital.transformation.goals",
        "ea_strategy_pillar_goal_rel",
        "pillar_id",
        "goal_id",
        string="Strategic Goals",
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
