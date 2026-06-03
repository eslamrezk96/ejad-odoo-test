/** @odoo-module **/

import { registry } from "@web/core/registry";
import { formView } from "@web/views/form/form_view";
import { FormRenderer } from "@web/views/form/form_renderer";
import { onMounted, onPatched, useRef } from "@odoo/owl";

class FormRendererWithTabCounters extends FormRenderer {
    setup() {
        super.setup();

        this.compiledViewRoot = useRef("compiled_view_root");

        onMounted(() => {
            requestAnimationFrame(() => this._updateNotebookCounters());
        });

        onPatched(() => {
            requestAnimationFrame(() => this._updateNotebookCounters());
        });
    }

    _getCount(fieldName) {
        const value = this.props.record.data[fieldName];

        if (!value) {
            return 0;
        }

        if (typeof value === "number") {
            return value;
        }

        if (typeof value.count === "number") {
            return value.count;
        }

        if (Array.isArray(value.records)) {
            return value.records.length;
        }

        if (Array.isArray(value.resIds)) {
            return value.resIds.length;
        }

        if (Array.isArray(value.currentIds)) {
            return value.currentIds.length;
        }

        return 0;
    }

    _setTabCounter(pageName, fieldName) {
        const rootEl = this.compiledViewRoot.el;

        if (!rootEl) {
            return;
        }

        const link = rootEl.querySelector(
            `.o_notebook .nav-link[name="${CSS.escape(pageName)}"]`
        );

        if (!link) {
            return;
        }

        if (!link.dataset.originalTitle) {
            link.dataset.originalTitle = link.textContent.trim();
        }

        const count = this._getCount(fieldName);

        const counter = document.createElement("span");
        counter.className = "o_notebook_o2m_counter";
        counter.textContent = count;

        link.replaceChildren(
            counter,
            document.createTextNode(` - ${link.dataset.originalTitle}`)
        );
    }

    _updateNotebookCounters() {
        this._setTabCounter("stages", "value_stream_stages_ids");
    }
}

registry.category("views").add("form_tab_counters", {
    ...formView,
    Renderer: FormRendererWithTabCounters,
});