from pathlib import Path

from odoo import http
from odoo.http import request


class EaServiceDetailController(http.Controller):
    @http.route("/twj_ea_enhancement/ea_service_detail", type="http", auth="user")
    def get_ea_service_detail(self, source_model=None, source_record_id=None):
        module_root = Path(__file__).resolve().parent.parent
        html_path = module_root / "ea_service_detail.html"
        html_content = html_path.read_text(encoding="utf-8")
        return request.make_response(
            html_content,
            headers=[
                ("Content-Type", "text/html; charset=utf-8"),
                ("X-Frame-Options", "SAMEORIGIN"),
            ],
        )
