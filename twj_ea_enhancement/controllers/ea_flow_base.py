from pathlib import Path
import json
import re

from odoo.http import request


class EaFlowBaseController:
    H = {
        "tt": "top-t",
        "ts": "top-s",
        "bt": "bottom-t",
        "bs": "bottom-s",
        "lt": "left-t",
        "ls": "left-s",
        "rt": "right-t",
        "rs": "right-s",
    }

    def _clamp(self, value, minimum, maximum):
        return max(minimum, min(maximum, value))

    def _text_width(self, label, is_root=False):
        return int(self._clamp((len(label) * (10 if is_root else 9)) + 36, 76, 300))

    def _item(self, item_id, label, x, y, extra=None):
        extra = extra or {}
        is_root = extra.get("variant") == "root"
        width = self._text_width(label, is_root=is_root)
        height = 54 if is_root else 46
        return {
            "id": item_id,
            "type": "ea",
            "position": {"x": x, "y": y},
            "data": {"label": label, **extra},
            "width": width,
            "height": height,
            "style": {"width": width, "height": height},
        }

    def _lane(self, lane_id, title, x, y, width, height):
        return {
            "id": lane_id,
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

    def _link(self, link_id, source, target, label, source_handle=None, target_handle=None):
        return {
            "id": link_id,
            "source": source,
            "target": target,
            "sourceHandle": source_handle or self.H["bs"],
            "targetHandle": target_handle or self.H["tt"],
            "type": "curved",
            "data": {"label": label},
        }

    def _ea_data(self, view_data):
        return {
            "H": self.H,
            "views": {
                "v1": view_data,
            },
        }

    def _json_response(self, payload):
        return request.make_response(
            json.dumps(payload, ensure_ascii=False),
            headers=[("Content-Type", "application/json; charset=utf-8")],
        )

    def _get_diagram_html(self, view_data):
        module_root = Path(__file__).resolve().parent.parent
        html_path = module_root / "ea_flow_diagram.html"
        html_content = html_path.read_text(encoding="utf-8")
        return self._inject_ea_data(html_content, self._ea_data(view_data))

    def _inject_ea_data(self, html_content, ea_data):
        match = re.search(
            r'(<script type="__bundler/template">\s*)(.*?)(\s*</script>)',
            html_content,
            flags=re.DOTALL,
        )
        if not match:
            return html_content

        template = json.loads(match.group(2))
        injection = f"""
<script type="text/babel">
window.EA_DATA = {json.dumps(ea_data, ensure_ascii=False)};
</script>
<style>.ea-tabs {{ display: none !important; }}</style>
"""
        marker = '<script type="text/babel" src="b6dd3c5c-a1c9-4ea7-86d1-6c24aa533897"></script>'
        if marker in template:
            template = template.replace(marker, injection + marker, 1)
        else:
            template = template.replace("</body>", injection + "</body>", 1)

        template_json = json.dumps(template, ensure_ascii=False).replace("</", "<\\/")
        return html_content[: match.start(2)] + template_json + html_content[match.end(2) :]

    def _diagram_response(self, view_data):
        return request.make_response(
            self._get_diagram_html(view_data),
            headers=[
                ("Content-Type", "text/html; charset=utf-8"),
                ("X-Frame-Options", "SAMEORIGIN"),
            ],
        )
