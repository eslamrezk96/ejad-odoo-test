import json
from pathlib import Path

from odoo import http
from odoo.http import request


class EaModelDiagramController(http.Controller):
    @http.route("/twj_ea_enhancement/ea_model_diagram", type="http", auth="user")
    def get_ea_model_diagram(self, source_model=None, source_record_id=None):
        module_root = Path(__file__).resolve().parent.parent
        html_path = module_root / "ea_model_diagram.html"
        html_content = html_path.read_text(encoding="utf-8")
        return request.make_response(
            html_content,
            headers=[
                ("Content-Type", "text/html; charset=utf-8"),
                ("X-Frame-Options", "SAMEORIGIN"),
            ],
        )

    @http.route("/twj_ea_enhancement/ea_model_diagram/data", type="http", auth="user", methods=["GET"])
    def get_ea_model_diagram_data(self, source_model=None, source_record_id=None):
        diagram_data = self._get_model_diagram_data(
            source_model=source_model,
            source_record_id=source_record_id,
        )
        return request.make_response(
            json.dumps(diagram_data),
            headers=[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Cache-Control", "no-store"),
            ],
        )

    def _get_model_diagram_data(self, source_model=None, source_record_id=None):
        source_record = self._get_source_record(
            source_model=source_model,
            source_record_id=source_record_id,
        )
        if not source_record:
            return self._empty_diagram_data()

        source_component = self._get_component(source_record._name)
        if not source_component:
            return self._empty_diagram_data(source_record=source_record)

        relation_groups = self._get_relation_groups(source_record, source_component)
        if not relation_groups:
            return self._empty_diagram_data(
                source_record=source_record,
                message="لا توجد علاقات أو سجلات مرتبطة",
            )

        nodes, edges = self._build_model_diagram(source_record, source_component, relation_groups)
        return {
            "label": "مخطط النموذج",
            "sub": source_record.display_name,
            "nodes": nodes,
            "edges": edges,
        }

    def _get_source_record(self, source_model=None, source_record_id=None):
        if not source_model or source_model not in request.env or not source_record_id:
            return None
        model = request.env[source_model].with_context(lang=request.env.context.get("lang"))

        try:
            return model.browse(int(source_record_id)).exists()
        except (TypeError, ValueError):
            return None

    def _get_component(self, model_name):
        return request.env["ea.component"].with_context(lang=request.env.context.get("lang")).search(
            [("data_model_id.model", "=", model_name)],
            order="sequence, id",
            limit=1,
        )

    def _get_relation_groups(self, source_record, source_component):
        relation_model = request.env["ea.component.relation"].with_context(lang=request.env.context.get("lang"))
        component_by_model = {
            component.data_model_id.model: component
            for component in request.env["ea.component"].with_context(lang=request.env.context.get("lang")).search(
                [("data_model_id", "!=", False)],
                order="sequence, id",
            )
            if component.data_model_id and component.data_model_id.model
        }

        if not hasattr(source_record, "_model_fields_domain"):
            return []

        field_records = request.env["ir.model.fields"].sudo().search(
            source_record._model_fields_domain(),
            order="name, id",
        )

        relation_groups = []
        for field_record in field_records:
            field = source_record._fields.get(field_record.name)
            if not field or field.type not in ("many2one", "one2many", "many2many"):
                continue

            destination_component = component_by_model.get(field.comodel_name)
            if not destination_component:
                continue

            component_relation = relation_model.search(
                [
                    ("source_type", "=", source_component.id),
                    ("dest_type", "=", destination_component.id),
                ],
                order="id",
                limit=1,
            )
            if not component_relation:
                continue

            related_records = source_record[field_record.name]
            if not related_records:
                continue

            relation_groups.append(
                {
                    "component": destination_component,
                    "relation": component_relation,
                    "records": related_records.sorted(
                        key=lambda record: (record.display_name or "", record.id)
                    ),
                }
            )

        return relation_groups

    def _build_model_diagram(self, source_record, source_component, relation_groups):
        lane_x = 300
        lane_width = 760
        node_height = 46
        root_height = 54
        source_y = 40
        first_group_y = 180

        nodes = [
            self._lane_node(
                "model-diagram-l-source",
                source_component.display_name,
                lane_x,
                20,
                lane_width,
                110,
            ),
            self._item_node(
                "model-diagram-root",
                source_record.display_name,
                40,
                source_y + 18,
                variant="root",
                height=root_height,
            ),
        ]
        edges = []

        current_y = first_group_y
        for group_index, relation_group in enumerate(relation_groups):
            records = relation_group["records"]
            lane_height = max(110, 38 + len(records) * 70)
            nodes.append(
                self._lane_node(
                    f"model-diagram-l-{group_index}",
                    relation_group["component"].display_name,
                    lane_x,
                    current_y,
                    lane_width,
                    lane_height,
                )
            )

            for record_index, related_record in enumerate(records):
                node_id = self._record_node_id(related_record)
                nodes.append(
                    self._item_node(
                        node_id,
                        related_record.display_name,
                        470,
                        current_y + 36 + record_index * 70,
                        height=node_height,
                    )
                )
                edges.append(
                    self._edge(
                        f"model-diagram-edge-{group_index}-{related_record._name.replace('.', '-')}-{related_record.id}",
                        "model-diagram-root",
                        node_id,
                        relation_group["relation"].display_name,
                    )
                )

            current_y += lane_height + 40

        return nodes, edges

    def _empty_diagram_data(self, source_record=None, message=""):
        return {
            "label": "مخطط النموذج",
            "sub": message or (source_record.display_name if source_record else ""),
            "nodes": [],
            "edges": [],
        }

    def _record_node_id(self, record):
        return f"model-diagram-{record._name.replace('.', '-')}-{record.id}"

    def _lane_node(self, node_id, title, x, y, width, height):
        return {
            "id": node_id,
            "type": "lane",
            "position": {"x": x, "y": y},
            "data": {"title": title},
            "draggable": False,
            "selectable": False,
            "connectable": False,
            "focusable": False,
            "width": width,
            "height": height,
            "style": {"width": width, "height": height, "zIndex": 0},
        }

    def _item_node(self, node_id, label, x, y, variant=None, height=46):
        width = self._get_node_width(label, variant=variant)
        data = {"label": label or ""}
        if variant:
            data["variant"] = variant
        return {
            "id": node_id,
            "type": "ea",
            "position": {"x": x, "y": y},
            "data": data,
            "width": width,
            "height": height,
            "style": {"width": width, "height": height},
        }

    def _edge(self, edge_id, source, target, label):
        return {
            "id": edge_id,
            "source": source,
            "target": target,
            "sourceHandle": "right-s",
            "targetHandle": "left-t",
            "type": "curved",
            "data": {"label": label},
        }

    def _get_node_width(self, label, variant=None):
        label_length = len(label or "")
        base_width = 95 + label_length * 8
        if variant == "root":
            base_width += 20
        return max(76, min(base_width, 300))
