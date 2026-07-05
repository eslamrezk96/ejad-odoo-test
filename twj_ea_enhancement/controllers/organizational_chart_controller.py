import json
from pathlib import Path

from odoo import http
from odoo.http import request


class OrganizationalChartController(http.Controller):
    @http.route("/twj_ea_enhancement/organizational_chart", type="http", auth="user")
    def get_organizational_chart(self):
        module_root = Path(__file__).resolve().parent.parent
        html_path = module_root / "organizational_chart.html"
        html_content = html_path.read_text(encoding="utf-8")
        return request.make_response(
            html_content,
            headers=[
                ("Content-Type", "text/html; charset=utf-8"),
                ("X-Frame-Options", "SAMEORIGIN"),
            ],
        )

    @http.route("/twj_ea_enhancement/organizational_chart/data", type="http", auth="user", methods=["GET"])
    def get_organizational_chart_data(self):
        chart_data = self._get_organization_unit_tree()
        return request.make_response(
            json.dumps(chart_data),
            headers=[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Cache-Control", "no-store"),
            ],
        )

    def _get_organization_unit_tree(self):
        units = request.env["ea.entity.organization.unit"].with_context(
            lang=request.env.context.get("lang")
        ).search([], order="parent_path, name, id")

        if not units:
            return {
                "id": "org_root",
                "label": "الهيكل التنظيمي",
                "children": [],
            }

        nodes_by_record_id = {
            unit.id: {
                "id": f"unit_{unit.id}",
                "label": unit.display_name,
                "children": [],
            }
            for unit in units
        }

        roots = []
        for unit in units:
            node = nodes_by_record_id[unit.id]
            parent = unit.parent_id
            if parent and parent.id in nodes_by_record_id:
                nodes_by_record_id[parent.id]["children"].append(node)
            else:
                roots.append(node)

        if len(roots) == 1:
            return roots[0]

        return {
            "id": "org_root",
            "label": "الهيكل التنظيمي",
            "children": roots,
        }
