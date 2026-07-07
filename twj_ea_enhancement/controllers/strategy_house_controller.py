import json
from pathlib import Path

from odoo import http
from odoo.http import request


class StrategyHouseController(http.Controller):
    @http.route("/twj_ea_enhancement/strategy_house", type="http", auth="user")
    def get_strategy_house(self):
        module_root = Path(__file__).resolve().parent.parent
        html_path = module_root / "strategy_house.html"
        html_content = html_path.read_text(encoding="utf-8")
        return request.make_response(
            html_content,
            headers=[
                ("Content-Type", "text/html; charset=utf-8"),
                ("X-Frame-Options", "SAMEORIGIN"),
            ],
        )

    @http.route("/twj_ea_enhancement/strategy_house/data", type="http", auth="user", methods=["GET"])
    def get_strategy_house_data(self, strategy_id=None):
        strategy_data = self._get_strategy_house_data(strategy_id=strategy_id)
        return request.make_response(
            json.dumps(strategy_data),
            headers=[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Cache-Control", "no-store"),
            ],
        )

    def _get_strategy_house_data(self, strategy_id=None):
        lang = request.env.context.get("lang")
        strategy_model = request.env["ea.entity.strategy"].with_context(lang=lang)

        strategy = strategy_model.browse(int(strategy_id)) if strategy_id else strategy_model
        if not strategy.exists():
            return {}

        pillars = [
            {
                "title": pillar.display_name,
                "goals": [goal.display_name for goal in pillar.strategic_goal_ids],
            }
            for pillar in strategy.pillars_ids
            if pillar.strategic_goal_ids
        ]

        return {
            "vision": {"label": "الرؤية", "text": strategy.vision or ""},
            "mission": {"label": "الرسالة", "text": strategy.mission or ""},
            "pillarsLabel": "الركائز",
            "goalsLabel": "الأهداف",
            "pillars": pillars,
        }
