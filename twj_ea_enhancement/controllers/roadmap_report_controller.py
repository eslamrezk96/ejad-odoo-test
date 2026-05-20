from odoo import _, http
from odoo.http import request


class BuildingBlockRoadmapReportController(http.Controller):
    @http.route("/building/block/roadmap/layers", type="json", auth="user")
    def get_building_block_roadmap_layers(self):
        layers = request.env["ea.layer"].with_context(lang=request.env.context.get("lang")).search_read(
            [],
            ["id", "name"],
            order="sequence, id",
        )
        return {
            "layers": [
                {
                    "id": layer["id"],
                    "name": layer["name"],
                }
                for layer in layers
            ]
        }

    @http.route("/building/block/roadmap/tags", type="json", auth="user")
    def get_building_block_roadmap_tags(self):
        tags = request.env["ea.entity.tags"].with_context(lang=request.env.context.get("lang")).search_read(
            [],
            ["id", "name"],
            order="name, id",
        )
        return {
            "tags": [
                {
                    "id": tag["id"],
                    "name": tag["name"],
                }
                for tag in tags
            ]
        }

    @http.route("/building/block/roadmap/search", type="json", auth="user")
    def search_building_block_roadmap_report(
        self, layer_ids=None, tag_ids=None, source_model=None, source_record_id=None
    ):
        layer_ids = layer_ids or []
        tag_ids = tag_ids or []

        try:
            clean_layer_ids = [int(current_layer_id) for current_layer_id in layer_ids if current_layer_id]
            clean_tag_ids = [int(current_tag_id) for current_tag_id in tag_ids if current_tag_id]
            clean_source_record_id = int(source_record_id) if source_record_id else False
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": _("Invalid filter selection."),
                "lines": [],
            }

        if not clean_layer_ids:
            return {
                "success": True,
                "message": "",
                "lines": [],
            }

        layers = request.env["ea.layer"].with_context(lang=request.env.context.get("lang")).browse(clean_layer_ids).exists()
        if not layers:
            return {
                "success": True,
                "message": "",
                "lines": [],
            }

        lines = []
        for layer in layers.sorted(key=lambda current_layer: (current_layer.sequence, current_layer.id)):
            components = layer.component_ids.filtered(
                lambda component: component.data_model_id and component.data_model_id.model
            ).sorted(key=lambda component: (component.sequence, component.id))

            for component in components:
                model_name = component.data_model_id.model
                if source_model and model_name != source_model:
                    continue
                model = request.env[model_name].with_context(lang=request.env.context.get("lang"))
                model_fields = model._fields
                domain = []

                if clean_tag_ids and "tags_ids" in model_fields:
                    domain.append(("tags_ids", "in", clean_tag_ids))
                if clean_source_record_id:
                    domain.append(("id", "=", clean_source_record_id))

                order = "name, id" if "name" in model_fields else "id"
                for record in model.search(domain, order=order):
                    transition = record.transition_id if "transition_id" in model_fields else False
                    tag_names = record.tags_ids.mapped("name") if "tags_ids" in model_fields else []
                    gaps = record.gap_ids if "gap_ids" in model_fields else request.env["ea.entity.gap"]
                    gap_names = gaps.mapped("name")
                    project_names = list(dict.fromkeys(gaps.mapped("projects_ids.name")))
                    change_type = record.change_type if "change_type" in model_fields and record.change_type else "none"
                    display_name = record.name if "name" in model_fields and record.name else f"{component.name} {record.id}"
                    type_name = record.type_id.name if "type_id" in model_fields and record.type_id else ""
                    current_base = record.entity_base_id if "entity_base_id" in model_fields else False
                    root_base = (
                        record.version_parent_entity_id
                        if "version_parent_entity_id" in model_fields and record.version_parent_entity_id
                        else current_base
                    )

                    lines.append(
                        {
                            "id": f"{model_name}-{record.id}",
                            "layer_id": layer.id,
                            "layer_name": layer.name,
                            "root_entity_id": root_base.id if root_base else record.id,
                            "root_entity_name": root_base.name if root_base and root_base.name else display_name,
                            "name": display_name,
                            "type_name": type_name,
                            "change_type": change_type,
                            "component_name": component.name,
                            "tag_names": tag_names,
                            "project_name": ", ".join(project_names),
                            "project_names": project_names,
                            "gap_names": gap_names,
                            "transition_name": transition.name if transition else "",
                            "start_date": str(transition.start_date) if transition and transition.start_date else "",
                            "end_date": str(transition.end_date) if transition and transition.end_date else "",
                        }
                    )

        return {
            "success": True,
            "message": "",
            "lines": lines,
        }


class MatrixRelationReportController(http.Controller):
    def _get_matrix_component_domain(self, component_model_names=None):
        domain = [("data_model_id", "!=", False)]
        if component_model_names is not None:
            domain.append(("data_model_id.model", "in", component_model_names))
        return domain

    def _get_matrix_components(self, component_model_names=None):
        return request.env["ea.component"].with_context(lang=request.env.context.get("lang")).search(
            self._get_matrix_component_domain(component_model_names),
            order="sequence, id",
        )

    def _serialize_matrix_component(self, component):
        model_name = component.data_model_id.model if component.data_model_id else False
        total_count = 0
        if model_name and model_name in request.env:
            total_count = request.env[model_name].with_context(lang=request.env.context.get("lang")).search_count([])
        return {
            "id": component.id,
            "name": component.name,
            "layer_id": component.layer_id.id,
            "layer_name": component.layer_id.name,
            "model": model_name,
            "count": total_count,
        }

    def _get_related_component_model_names(self, model_name):
        all_components = self._get_matrix_components()
        component_models = {
            component.data_model_id.model: component
            for component in all_components
            if component.data_model_id and component.data_model_id.model
        }
        if model_name not in component_models or model_name not in request.env:
            return []

        related_model_names = set()
        source_model = request.env[model_name]

        for field in source_model._fields.values():
            if field.type not in ("many2one", "one2many", "many2many"):
                continue
            if field.comodel_name in component_models:
                related_model_names.add(field.comodel_name)

        return sorted(
            related_model_names,
            key=lambda current_model_name: (
                component_models[current_model_name].sequence,
                component_models[current_model_name].id,
            ),
        )

    @http.route("/matrix/relation/domains", type="json", auth="user")
    def get_matrix_relation_domains(self):
        layers = request.env["ea.layer"].with_context(lang=request.env.context.get("lang")).search_read(
            [],
            ["id", "name"],
            order="sequence, id",
        )
        return {
            "domains": [
                {
                    "id": layer["id"],
                    "name": layer["name"],
                }
                for layer in layers
            ]
        }

    @http.route("/matrix/relation/tags", type="json", auth="user")
    def get_matrix_relation_tags(self):
        tags = request.env["ea.entity.tags"].with_context(lang=request.env.context.get("lang")).search_read(
            [],
            ["id", "name"],
            order="name, id",
        )
        return {
            "tags": [
                {
                    "id": tag["id"],
                    "name": tag["name"],
                }
                for tag in tags
            ]
        }

    @http.route("/matrix/relation/transitions", type="json", auth="user")
    def get_matrix_relation_transitions(self):
        transitions = request.env["ea.transition"].with_context(lang=request.env.context.get("lang")).search_read(
            [],
            ["id", "name"],
            order="start_date, id",
        )
        return {
            "transitions": [
                {
                    "id": transition["id"],
                    "name": transition["name"],
                }
                for transition in transitions
            ]
        }

    @http.route("/matrix/relation/from-components", type="json", auth="user")
    def get_matrix_relation_from_components(self, domain_ids=None):
        domain_ids = domain_ids or []
        try:
            clean_domain_ids = [int(current_domain_id) for current_domain_id in domain_ids if current_domain_id]
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": _("Invalid domain selection."),
                "components": [],
            }

        if not clean_domain_ids:
            return {
                "success": True,
                "message": "",
                "components": [],
            }

        components = self._get_matrix_components().filtered(lambda component: component.layer_id.id in clean_domain_ids)
        return {
            "success": True,
            "message": "",
            "components": [self._serialize_matrix_component(component) for component in components],
        }

    @http.route("/matrix/relation/to-components", type="json", auth="user")
    def get_matrix_relation_to_components(self, from_component_id=None):
        try:
            clean_from_component_id = int(from_component_id) if from_component_id else False
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": _("Invalid component selection."),
                "components": [],
            }

        if not clean_from_component_id:
            return {
                "success": True,
                "message": "",
                "components": [],
            }

        component = request.env["ea.component"].with_context(lang=request.env.context.get("lang")).browse(
            clean_from_component_id
        ).exists()
        if not component or not component.data_model_id or not component.data_model_id.model:
            return {
                "success": True,
                "message": "",
                "components": [],
            }

        related_model_names = self._get_related_component_model_names(component.data_model_id.model)
        related_components = self._get_matrix_components(related_model_names)
        return {
            "success": True,
            "message": "",
            "components": [self._serialize_matrix_component(related_component) for related_component in related_components],
        }


class ValueStreamMapController(http.Controller):
    @http.route("/value/stream/map/data", type="json", auth="user")
    def get_value_stream_map_data(self, value_stream_id=None):
        try:
            clean_value_stream_id = int(value_stream_id) if value_stream_id else False
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": _("Invalid value stream."),
                "value_stream": {},
                "stages": [],
            }

        if not clean_value_stream_id:
            return {
                "success": False,
                "message": _("Missing value stream."),
                "value_stream": {},
                "stages": [],
            }

        value_stream = request.env["ea.entity.value.stream"].with_context(
            lang=request.env.context.get("lang")
        ).browse(clean_value_stream_id).exists()
        if not value_stream:
            return {
                "success": False,
                "message": _("Value stream not found."),
                "value_stream": {},
                "stages": [],
            }

        stages = []
        for stage in value_stream.value_stream_stages_ids.sorted(key=lambda current_stage: (current_stage.sequence, current_stage.id)):
            capabilities = stage.capabilities_ids.sorted(key=lambda capability: (capability.name or "", capability.id))
            services_map = {}
            applications_map = {}

            capability_items = []
            for capability in capabilities:
                capability_items.append(
                    {
                        "id": capability.id,
                        "name": capability.name,
                        "change_type": capability.change_type or "none",
                    }
                )
                for service in capability.business_service_ids.sorted(key=lambda current_service: (current_service.name or "", current_service.id)):
                    services_map.setdefault(
                        service.id,
                        {
                            "id": service.id,
                            "name": service.name,
                            "change_type": service.change_type or "none",
                        },
                    )
                    for application in service.application_ids.sorted(
                        key=lambda current_application: (current_application.name or "", current_application.id)
                    ):
                        applications_map.setdefault(
                            application.id,
                            {
                                "id": application.id,
                                "name": application.name,
                                "change_type": application.change_type or "none",
                            },
                        )

            stages.append(
                {
                    "id": stage.id,
                    "name": stage.name,
                    "sequence": stage.sequence,
                    "capabilities": capability_items,
                    "services": list(services_map.values()),
                    "applications": list(applications_map.values()),
                }
            )

        return {
            "success": True,
            "message": "",
            "value_stream": {
                "id": value_stream.id,
                "name": value_stream.name,
            },
            "stages": stages,
        }
