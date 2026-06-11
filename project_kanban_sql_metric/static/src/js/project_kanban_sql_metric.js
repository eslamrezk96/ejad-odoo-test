/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { kanbanView } from "@web/views/kanban/kanban_view";
import { formatMonetary } from "@web/views/fields/formatters";
import { KanbanRenderer } from "@web/views/kanban/kanban_renderer";
import { KanbanHeader } from "@web/views/kanban/kanban_header";

class ProjectKanbanSqlMetricHeader extends KanbanHeader {
    static template = "project_kanban_sql_metric.KanbanHeader";

    get currencyId() {
        if (session.company_currency_id) {
            return session.company_currency_id;
        }
        const currentCompanyId = session.user_companies?.current_company;
        const currentCompany = currentCompanyId
            ? session.user_companies?.allowed_companies?.[currentCompanyId]
            : null;
        if (Array.isArray(currentCompany?.currency_id)) {
            return currentCompany.currency_id[0];
        }
        if (typeof currentCompany?.currency_id === "number") {
            return currentCompany.currency_id;
        }
        const currencyIds = Object.keys(session.currencies || {});
        return currencyIds.length ? Number(currencyIds[0]) : null;
    }

    _formatMetric(value) {
        return formatMonetary(value || 0, {
            currencyId: this.currencyId,
        });
    }

    get formattedTotal() {
        return this._formatMetric(this.group.aggregates.x_kanban_total_boq);
    }

    get formattedDone() {
        return this._formatMetric(this.group.aggregates.x_kanban_delivered);
    }

    get formattedRemaining() {
        return this._formatMetric(this.group.aggregates.x_kanban_remaining);
    }
}

class ProjectKanbanSqlMetricRenderer extends KanbanRenderer {
    static components = {
        ...KanbanRenderer.components,
        KanbanHeader: ProjectKanbanSqlMetricHeader,
    };
}

registry.category("views").add("project_kanban_sql_metric", {
    ...kanbanView,
    Renderer: ProjectKanbanSqlMetricRenderer,
});
