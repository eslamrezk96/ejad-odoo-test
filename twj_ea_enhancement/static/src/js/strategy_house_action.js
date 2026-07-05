/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";

class StrategyHouseAction extends Component {
    static template = "twj_ea_enhancement.StrategyHouseAction";

    setup() {
        const currentLang = (session.user_context.lang || "").toLowerCase();
        const actionParams = this.props.action?.params || {};
        const strategyId = actionParams.strategy_id;
        this.isRTL = currentLang.startsWith("ar");
        this.strategyHouseUrl = strategyId
            ? `/twj_ea_enhancement/strategy_house?strategy_id=${encodeURIComponent(strategyId)}`
            : "/twj_ea_enhancement/strategy_house";
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getTitle() {
        return _t("Strategy House");
    }

    getSubtitle() {
        return _t("Strategic map view");
    }
}

registry.category("actions").add(
    "twj_ea_enhancement.strategy_house_client_action",
    StrategyHouseAction
);
