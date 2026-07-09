/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";

class EaModelDiagramAction extends Component {
    static template = "twj_ea_enhancement.EaModelDiagramAction";

    setup() {
        const currentLang = (session.user_context.lang || "").toLowerCase();
        const actionParams = this.props.action?.params || {};
        const urlParams = new URLSearchParams();

        this.isRTL = currentLang.startsWith("ar");

        if (actionParams.source_model) {
            urlParams.set("source_model", actionParams.source_model);
        }
        if (actionParams.source_record_id) {
            urlParams.set("source_record_id", actionParams.source_record_id);
        }

        const queryString = urlParams.toString();
        this.eaModelDiagramUrl = queryString
            ? `/twj_ea_enhancement/ea_model_diagram?${queryString}`
            : "/twj_ea_enhancement/ea_model_diagram";
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getTitle() {
        return _t("EA Model Diagram");
    }

    getSubtitle() {
        return _t("Model relationship diagram");
    }
}

registry.category("actions").add(
    "twj_ea_enhancement.ea_model_diagram_client_action",
    EaModelDiagramAction
);
