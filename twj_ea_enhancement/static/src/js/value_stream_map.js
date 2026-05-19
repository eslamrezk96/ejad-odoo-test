/** @odoo-module **/

import { Component, onWillStart, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";
import { useService } from "@web/core/utils/hooks";

class ValueStreamMap extends Component {
    static template = "twj_ea_enhancement.ValueStreamMap";

    setup() {
        this.rpc = useService("rpc");
        this.notification = useService("notification");
        this.actionParams = this.props.action?.params || {};
        this.arrowDirectionClass = (session.user_context.lang || "").toLowerCase().startsWith("ar")
            ? "o_vsm_arrow_rtl"
            : "o_vsm_arrow_ltr";

        this.state = useState({
            loading: true,
            message: "",
            valueStream: {},
            stages: [],
        });

        onWillStart(async () => {
            await this.loadValueStreamMap();
        });
    }

    async loadValueStreamMap() {
        this.state.loading = true;
        this.state.message = "";
        try {
            const result = await this.rpc("/value/stream/map/data", {
                value_stream_id: this.actionParams.source_record_id,
            });
            if (!result.success) {
                this.state.message = result.message || _t("Failed to load value stream map.");
                this.state.valueStream = {};
                this.state.stages = [];
                return;
            }
            this.state.valueStream = result.value_stream || {};
            this.state.stages = (result.stages || []).map((stage) => ({
                ...stage,
                columnClass:
                    "o_vsm_stage_column o_vsm_stage_flow_column o_vsm_stage_column_connect_bottom " +
                    this.arrowDirectionClass,
            }));
        } catch (error) {
            console.error("Failed to load value stream map:", error);
            this.state.message = _t("Failed to load value stream map.");
            this.notification.add(this.state.message, { type: "danger" });
        } finally {
            this.state.loading = false;
        }
    }

    getStatusLabel(changeType) {
        const labelMap = {
            none: _t("Idea"),
            new: _t("Planned"),
            change: _t("Build"),
            active: _t("Active"),
            maintain: _t("Maintain"),
            optimize: _t("Optimize"),
            cancel: _t("Sunset"),
            old: _t("Retired"),
        };
        return labelMap[changeType || "none"] || labelMap.none;
    }

    getStatusClass(changeType) {
        return `bg-${changeType || "none"}`;
    }
}

registry.category("actions").add("twj_ea_enhancement.value_stream_map_client_action", ValueStreamMap);
