from odoo import http

from .ea_flow_base import EaFlowBaseController


class ServiceDetailDiagramController(EaFlowBaseController, http.Controller):
    def _service_detail_data(self):
        row_y = {"main": 30, "channels": 180, "app": 330, "apps": 480}
        lanes = [
            self._lane("v2-l-main", "خدمة الأعمال الرئيسية", 300, row_y["main"], 760, 110),
            self._lane("v2-l-channels", "القنوات", 300, row_y["channels"], 760, 110),
            self._lane("v2-l-app", "التطبيق", 300, row_y["app"], 760, 110),
            self._lane("v2-l-apps", "التطبيقات", 300, row_y["apps"], 760, 170),
        ]
        items = [
            self._item("v2-req", "متطلبات البيانات المستقبلية", 470, row_y["main"] + 36),
            self._item("v2-portal", "البوابة الإلكترونية للجامعة", 470, row_y["channels"] + 36),
            self._item("v2-sis", "نظام معلومات الطلبة", 470, row_y["app"] + 36),
            self._item("v2-support", "أنظمة داعمة", 470, row_y["apps"] + 34),
            self._item("v2-admin", "النظام الإداري", 470, row_y["apps"] + 104),
            self._item("v2-root", "خدمة تسجيل بحث علمي", 40, row_y["apps"] + 20, {"variant": "root"}),
        ]
        edges = [
            self._link("v2e1", "v2-root", "v2-req", "أتمتة بـ", self.H["rs"], self.H["lt"]),
            self._link("v2e2", "v2-root", "v2-portal", "يُقدَّم عبر", self.H["rs"], self.H["lt"]),
            self._link("v2e3", "v2-root", "v2-sis", "يستخدم", self.H["rs"], self.H["lt"]),
            self._link("v2e4", "v2-root", "v2-support", "أتمتة بـ", self.H["rs"], self.H["lt"]),
            self._link("v2e5", "v2-root", "v2-admin", "أتمتة بـ", self.H["rs"], self.H["lt"]),
        ]
        return {
            "label": "تفصيل الخدمة",
            "sub": "خدمة تسجيل بحث علمي",
            "nodes": lanes + items,
            "edges": edges,
        }

    @http.route("/twj_ea_enhancement/ea_flow_diagram/service_detail", type="http", auth="user")
    def get_service_detail_diagram(self):
        return self._diagram_response(self._service_detail_data())

    @http.route("/twj_ea_enhancement/ea_flow_diagram/data/service_detail", type="http", auth="user")
    def get_service_detail_diagram_data(self):
        return self._json_response(self._service_detail_data())
