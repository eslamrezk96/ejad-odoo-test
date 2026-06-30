/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";

class EaFlowDiagramAction extends Component {
    static template = "twj_ea_enhancement.EaFlowDiagramAction";
    static diagramUrl = "/twj_ea_enhancement/ea_flow_diagram";
    static title = _t("EA Flow Diagram");

    setup() {
        const currentLang = (session.user_context.lang || "").toLowerCase();
        this.isRTL = currentLang.startsWith("ar");
        this.diagramUrl = this.constructor.diagramUrl;
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getTitle() {
        return this.constructor.title;
    }
}

class EnterpriseModelDiagramAction extends EaFlowDiagramAction {}
EnterpriseModelDiagramAction.diagramUrl = "/twj_ea_enhancement/ea_flow_diagram/enterprise_model";
EnterpriseModelDiagramAction.title = _t("Enterprise Model");

class ServiceDetailDiagramAction extends EaFlowDiagramAction {}
ServiceDetailDiagramAction.diagramUrl = "/twj_ea_enhancement/ea_flow_diagram/service_detail";
ServiceDetailDiagramAction.title = _t("Service Detail");

registry.category("actions").add(
    "twj_ea_enhancement.enterprise_model_diagram_client_action",
    EnterpriseModelDiagramAction
);
registry.category("actions").add(
    "twj_ea_enhancement.service_detail_diagram_client_action",
    ServiceDetailDiagramAction
);
