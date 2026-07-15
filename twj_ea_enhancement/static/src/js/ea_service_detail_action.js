/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";

class EaServiceDetailAction extends Component {
    static template = "twj_ea_enhancement.EaServiceDetailAction";

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
        this.eaServiceDetailUrl = queryString
            ? `/twj_ea_enhancement/ea_service_detail?${queryString}`
            : "/twj_ea_enhancement/ea_service_detail";
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getTitle() {
        return _t("EA Service Detail");
    }

    getSubtitle() {
        return _t("Service relationship diagram");
    }
}

registry.category("actions").add(
    "twj_ea_enhancement.ea_service_detail_client_action",
    EaServiceDetailAction
);
