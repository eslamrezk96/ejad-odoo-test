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
        env = request.env.with_context(lang=request.env.context.get("lang"))
        strategy_model = env["ea.entity.strategy"]
        goal_model = env["ea.entity.digital.transformation.goals"]

        strategies = strategy_model.search(self._get_strategy_domain(strategy_id), order="name, id")
        goals = goal_model.search([], order="name, id")

        if not strategies:
            return self._empty_strategy_data()

        goal_buckets = [[] for strategy in strategies]
        for index, goal in enumerate(goals):
            goal_buckets[index % len(goal_buckets)].append(goal.display_name)

        pillars = []
        for index, strategy in enumerate(strategies):
            pillars.append(
                {
                    "title": strategy.display_name,
                    "goals": goal_buckets[index],
                }
            )

        strategy_data = self._empty_strategy_data()
        strategy_data["pillars"] = pillars
        return strategy_data

    def _get_strategy_domain(self, strategy_id=None):
        if not strategy_id:
            return []
        try:
            return [("id", "=", int(strategy_id))]
        except (TypeError, ValueError):
            return [("id", "=", 0)]

    def _empty_strategy_data(self):
        return {
            "vision": {"label": "الرؤية", "text": "تجربة استثمار رقمية مبتكرة آمنة"},
            "mission": {
                "label": "الرسالة",
                "text": "فتح مجالات استثمار متنوعة الأصل والأثر وتحسين العائد للناتج القومي",
            },
            "pillarsLabel": "الركائز",
            "goalsLabel": "الأهداف",
            "pillars": [],
        }
