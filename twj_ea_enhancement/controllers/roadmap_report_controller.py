from odoo import _, http
from odoo.http import request


class BuildingBlockRoadmapReportController(http.Controller):
    @http.route("/twj_ea_enhancement/layers", type="json", auth="user")
    def get_layers(self):
        layers = request.env["ea.layer"].with_context(lang=request.env.context.get("lang")).sudo().search(
            [],
            order="sequence, id",
        )
        return {
            "layers": [
                {
                    "id": layer.id,
                    "name": layer.name,
                }
                for layer in layers
            ]
        }

    @http.route("/twj_ea_enhancement/tags", type="json", auth="user")
    def get_tags(self):
        tags = request.env["ea.entity.tags"].with_context(lang=request.env.context.get("lang")).sudo().search(
            [],
            order="name, id",
        )
        return {
            "tags": [
                {
                    "id": tag.id,
                    "name": tag.name,
                }
                for tag in tags
            ]
        }

    @http.route("/twj_ea_enhancement/search", type="json", auth="user")
    def search_report(self, layer_ids=None, tag_ids=None, source_model=None, source_record_id=None):
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

        layers = request.env["ea.layer"].with_context(lang=request.env.context.get("lang")).sudo().browse(clean_layer_ids).exists()
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
                model = request.env[model_name].with_context(lang=request.env.context.get("lang")).sudo()
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

                    lines.append(
                        {
                            "id": f"{model_name}-{record.id}",
                            "layer_id": layer.id,
                            "layer_name": layer.name,
                            "name": display_name,
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
