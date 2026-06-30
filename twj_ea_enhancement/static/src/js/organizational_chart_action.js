/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";

class OrganizationalChartAction extends Component {
    static template = "twj_ea_enhancement.OrganizationalChartAction";

    setup() {
        const currentLang = (session.user_context.lang || "").toLowerCase();
        this.isRTL = currentLang.startsWith("ar");
        this.chartUrl = "/twj_ea_enhancement/organizational_chart";
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getTitle() {
        return _t("Organizational Chart");
    }

    getSubtitle() {
        return _t("Interactive organizational structure view");
    }
}

registry.category("actions").add(
    "twj_ea_enhancement.organizational_chart_client_action",
    OrganizationalChartAction
);
