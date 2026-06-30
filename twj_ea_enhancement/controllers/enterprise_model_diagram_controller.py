from odoo import http
from odoo.http import request

from .ea_flow_base import EaFlowBaseController


class EnterpriseModelDiagramController(EaFlowBaseController, http.Controller):
    def _component_node_id(self, component):
        return f"component-{component.id}"

    def _component_positions(self, components, lane_x, lane_y, lane_width):
        components = list(components)
        if not components:
            return {}

        left_padding = 70
        right_padding = 70
        row_top = lane_y + 44
        row_gap = 58
        max_columns = 5
        columns = min(max_columns, len(components))
        usable_width = lane_width - left_padding - right_padding
        step = usable_width / max(columns - 1, 1)

        positions = {}
        for index, component in enumerate(components):
            column = index % columns
            row = index // columns
            x = lane_x + (lane_width / 2) - 60 if columns == 1 else lane_x + left_padding + column * step
            positions[component.id] = {
                "x": int(x),
                "y": int(row_top + row * row_gap),
            }
        return positions

    def _lane_height(self, component_count):
        if not component_count:
            return 110
        max_columns = 5
        rows = ((component_count - 1) // max_columns) + 1
        return max(110, 44 + rows * 58 + 20)

    def _get_component_relations(self, layers):
        try:
            relation_model = request.env["ea.component.relation"]
        except KeyError:
            return request.env["ea.component"].browse()

        relation_fields = relation_model._fields
        if "source_type" not in relation_fields or "dest_type" not in relation_fields:
            return relation_model.browse()

        return relation_model.search(
            [
                "|",
                ("source_type.layer_id", "in", layers.ids),
                ("dest_type.layer_id", "in", layers.ids),
            ]
        )

    def _relation_label(self, relation):
        for field_name in ("name", "relation_type", "type", "description"):
            if field_name in relation._fields and relation[field_name]:
                value = relation[field_name]
                return value.display_name if hasattr(value, "display_name") else value
        return relation.display_name if relation.display_name != f"ea.component.relation,{relation.id}" else ""

    def _relation_edges(self, layers, component_node_ids):
        edges = []
        for relation in self._get_component_relations(layers):
            source = relation.source_type
            target = relation.dest_type
            if not source or not target:
                continue
            source_node_id = component_node_ids.get(source.id)
            target_node_id = component_node_ids.get(target.id)
            if not source_node_id or not target_node_id:
                continue
            edges.append(
                self._link(
                    f"relation-{relation.id}",
                    source_node_id,
                    target_node_id,
                    self._relation_label(relation),
                )
            )
        return edges

    def _enterprise_model_data(self):
        lane_x = 24
        lane_width = 1240
        gap = 40

        layers = request.env["ea.layer"].with_context(lang=request.env.context.get("lang")).search(
            [],
            order="sequence, id",
        )
        components = request.env["ea.component"].with_context(lang=request.env.context.get("lang")).search(
            [("layer_id", "in", layers.ids)],
            order="layer_id, sequence, id",
        )

        lanes = []
        items = []
        component_node_ids = {}
        current_y = 20
        for index, layer in enumerate(layers):
            layer_components = components.filtered(lambda component: component.layer_id == layer).sorted(
                key=lambda component: (component.sequence, component.id)
            )
            lane_height = self._lane_height(len(layer_components))
            y = current_y
            lanes.append(self._lane(f"layer-{layer.id}", layer.name, lane_x, y, lane_width, lane_height))

            positions = self._component_positions(layer_components, lane_x, y, lane_width)
            for component in layer_components:
                node_id = self._component_node_id(component)
                component_node_ids[component.id] = node_id
                position = positions[component.id]
                items.append(
                    self._item(
                        node_id,
                        component.name,
                        position["x"],
                        position["y"],
                    )
                )
            current_y += lane_height + gap

        edges = self._relation_edges(layers, component_node_ids)
        return {
            "label": "النموذج المؤسسي",
            "sub": "نموذج البنية المؤسسية",
            "nodes": lanes + items,
            "edges": edges,
        }

    @http.route("/twj_ea_enhancement/ea_flow_diagram", type="http", auth="user")
    def get_ea_flow_diagram(self):
        return self._diagram_response(self._enterprise_model_data())

    @http.route("/twj_ea_enhancement/ea_flow_diagram/enterprise_model", type="http", auth="user")
    def get_enterprise_model_diagram(self):
        return self._diagram_response(self._enterprise_model_data())

    @http.route("/twj_ea_enhancement/ea_flow_diagram/data/enterprise_model", type="http", auth="user")
    def get_enterprise_model_diagram_data(self):
        return self._json_response(self._enterprise_model_data())
