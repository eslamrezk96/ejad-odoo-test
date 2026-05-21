/** @odoo-module **/

import { Component, onMounted, onWillStart, onWillUnmount, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";
import { useService } from "@web/core/utils/hooks";

class MatrixRelationReport extends Component {
    static template = "twj_ea_enhancement.MatrixRelationReport";

    setup() {
        this.notification = useService("notification");
        this.rpc = useService("rpc");
        const currentLang = (session.user_context.lang || "").toLowerCase();
        this.isRTL = currentLang.startsWith("ar");

        this.state = useState({
            domains: [],
            selectedDomainIds: [],
            domainDropdownOpen: false,
            domainSearchTerm: "",
            tags: [],
            selectedTagIds: [],
            tagDropdownOpen: false,
            tagSearchTerm: "",
            transitions: [],
            selectedTransitionIds: [],
            transitionDropdownOpen: false,
            transitionSearchTerm: "",
            fromComponents: [],
            selectedFromComponentId: "",
            toComponents: [],
            selectedToComponentId: "",
            loadingDomains: false,
            loadingTags: false,
            loadingTransitions: false,
            loadingFromComponents: false,
            loadingToComponents: false,
            loadingPreview: false,
            previewLoaded: false,
            previewMessage: "",
            matrix: {
                fromComponentName: "",
                toComponentName: "",
                rows: [],
                columns: [],
                cells: [],
                hasRelations: false,
            },
        });

        this.onDocumentPointerDown = this.onDocumentPointerDown.bind(this);

        onWillStart(async () => {
            await this.loadDomains();
            await this.loadTags();
            await this.loadTransitions();
            await this.loadFromComponents();
        });

        onMounted(() => {
            document.addEventListener("pointerdown", this.onDocumentPointerDown, true);
        });

        onWillUnmount(() => {
            document.removeEventListener("pointerdown", this.onDocumentPointerDown, true);
        });
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getText(key) {
        const texts = {
            title: _t("MATRIX RELATION REPORT"),
            subtitle: _t("Generate matrix report between two related model components"),
            sectionTitle: _t("1. SELECT COMPONENTS FOR MATRIX REPORT"),
            domain: _t("Domain"),
            searchDomain: _t("Search domains..."),
            selectDomains: _t("Select domains"),
            selectDomainsPlaceholder: _t("Select domains..."),
            tags: _t("Tags"),
            searchTags: _t("Search tags..."),
            selectTags: _t("Select tags"),
            selectTagsPlaceholder: _t("Select tags..."),
            transition: _t("Transition"),
            searchTransitions: _t("Search transitions..."),
            selectTransitions: _t("Select transitions"),
            selectTransitionsPlaceholder: _t("Select transitions..."),
            clear: _t("Clear"),
            loading: _t("Loading..."),
            fromRows: _t("From (Rows)"),
            modelComponent: _t("Model Component"),
            toColumns: _t("To (Columns)"),
            relatedModelComponent: _t("Related Model Component"),
            preview: _t("Preview"),
            previewSectionTitle: _t("2. MATRIX RELATION REPORT"),
            selectComponent: _t("Select component..."),
            noRelatedComponents: _t("No related components found."),
            missingPreviewSelection: _t("Select From (Rows) and To (Columns) first."),
            loadingPreview: _t("Loading preview..."),
            noMatrixRows: _t("No records match the current filters."),
            noMatrixRelations: _t("No relations found for the current filters."),
            remove: _t("Remove"),
        };
        return texts[key] || "";
    }

    async loadDomains() {
        this.state.loadingDomains = true;
        try {
            const result = await this.rpc("/matrix/relation/domains", {});
            this.state.domains = result.domains || [];
            this.state.selectedDomainIds = this.state.domains.map((domain) => String(domain.id));
        } catch (error) {
            console.error("Failed to load matrix domains:", error);
            this.notification.add(_t("Failed to load domains."), { type: "danger" });
        } finally {
            this.state.loadingDomains = false;
        }
    }

    async loadTags() {
        this.state.loadingTags = true;
        try {
            const result = await this.rpc("/matrix/relation/tags", {});
            this.state.tags = result.tags || [];
        } catch (error) {
            console.error("Failed to load matrix tags:", error);
            this.notification.add(_t("Failed to load tags."), { type: "danger" });
        } finally {
            this.state.loadingTags = false;
        }
    }

    async loadTransitions() {
        this.state.loadingTransitions = true;
        try {
            const result = await this.rpc("/matrix/relation/transitions", {});
            this.state.transitions = result.transitions || [];
        } catch (error) {
            console.error("Failed to load matrix transitions:", error);
            this.notification.add(_t("Failed to load transitions."), { type: "danger" });
        } finally {
            this.state.loadingTransitions = false;
        }
    }

    async loadFromComponents() {
        this.state.loadingFromComponents = true;
        this.state.selectedFromComponentId = "";
        this.state.selectedToComponentId = "";
        this.state.toComponents = [];
        this.resetPreview();

        try {
            if (!this.state.selectedDomainIds.length) {
                this.state.fromComponents = [];
                return;
            }

            const result = await this.rpc("/matrix/relation/from-components", {
                domain_ids: this.state.selectedDomainIds,
            });
            this.state.fromComponents = result.components || [];
        } catch (error) {
            console.error("Failed to load from components:", error);
            this.notification.add(_t("Failed to load components."), { type: "danger" });
            this.state.fromComponents = [];
        } finally {
            this.state.loadingFromComponents = false;
        }
    }

    async loadToComponents() {
        this.state.loadingToComponents = true;
        this.state.selectedToComponentId = "";
        this.resetPreview();

        try {
            if (!this.state.selectedFromComponentId) {
                this.state.toComponents = [];
                return;
            }

            const result = await this.rpc("/matrix/relation/to-components", {
                from_component_id: this.state.selectedFromComponentId,
            });
            this.state.toComponents = result.components || [];
        } catch (error) {
            console.error("Failed to load related components:", error);
            this.notification.add(_t("Failed to load related components."), { type: "danger" });
            this.state.toComponents = [];
        } finally {
            this.state.loadingToComponents = false;
        }
    }

    toggleDomainDropdown() {
        if (this.state.loadingDomains) {
            return;
        }
        this.closeAuxiliaryDropdowns("domain");
        this.state.domainDropdownOpen = !this.state.domainDropdownOpen;
    }

    closeDomainDropdown() {
        this.state.domainDropdownOpen = false;
    }

    toggleTagDropdown() {
        if (this.state.loadingTags) {
            return;
        }
        this.closeAuxiliaryDropdowns("tag");
        this.state.tagDropdownOpen = !this.state.tagDropdownOpen;
    }

    closeTagDropdown() {
        this.state.tagDropdownOpen = false;
    }

    toggleTransitionDropdown() {
        if (this.state.loadingTransitions) {
            return;
        }
        this.closeAuxiliaryDropdowns("transition");
        this.state.transitionDropdownOpen = !this.state.transitionDropdownOpen;
    }

    closeTransitionDropdown() {
        this.state.transitionDropdownOpen = false;
    }

    closeAllDropdowns() {
        this.closeDomainDropdown();
        this.closeTagDropdown();
        this.closeTransitionDropdown();
    }

    resetPreview() {
        this.state.previewLoaded = false;
        this.state.previewMessage = "";
        this.state.matrix = {
            fromComponentName: "",
            toComponentName: "",
            rows: [],
            columns: [],
            cells: [],
            hasRelations: false,
        };
    }

    closeAuxiliaryDropdowns(keepOpen) {
        if (keepOpen !== "domain") {
            this.closeDomainDropdown();
        }
        if (keepOpen !== "tag") {
            this.closeTagDropdown();
        }
        if (keepOpen !== "transition") {
            this.closeTransitionDropdown();
        }
    }

    onDocumentPointerDown(ev) {
        if (!this.el) {
            return;
        }
        const domainDropdown = this.el.querySelector(".o_matrix_domain_filter_dropdown");
        const tagDropdown = this.el.querySelector(".o_matrix_tag_filter_dropdown");
        const transitionDropdown = this.el.querySelector(".o_matrix_transition_filter_dropdown");

        if (this.state.domainDropdownOpen && domainDropdown && !domainDropdown.contains(ev.target)) {
            this.closeDomainDropdown();
        }
        if (this.state.tagDropdownOpen && tagDropdown && !tagDropdown.contains(ev.target)) {
            this.closeTagDropdown();
        }
        if (this.state.transitionDropdownOpen && transitionDropdown && !transitionDropdown.contains(ev.target)) {
            this.closeTransitionDropdown();
        }
    }

    getSelectedDomains() {
        return this.state.domains.filter((domain) => this.state.selectedDomainIds.includes(String(domain.id)));
    }

    getVisibleDomains() {
        const searchTerm = (this.state.domainSearchTerm || "").trim().toLowerCase();
        if (!searchTerm) {
            return this.state.domains;
        }
        return this.state.domains.filter((domain) => (domain.name || "").toLowerCase().includes(searchTerm));
    }

    getSelectedTags() {
        return this.state.tags.filter((tag) => this.state.selectedTagIds.includes(String(tag.id)));
    }

    getVisibleTags() {
        const searchTerm = (this.state.tagSearchTerm || "").trim().toLowerCase();
        if (!searchTerm) {
            return this.state.tags;
        }
        return this.state.tags.filter((tag) => (tag.name || "").toLowerCase().includes(searchTerm));
    }

    getSelectedTransitions() {
        return this.state.transitions.filter(
            (transition) => this.state.selectedTransitionIds.includes(String(transition.id))
        );
    }

    getVisibleTransitions() {
        const searchTerm = (this.state.transitionSearchTerm || "").trim().toLowerCase();
        if (!searchTerm) {
            return this.state.transitions;
        }
        return this.state.transitions.filter(
            (transition) => (transition.name || "").toLowerCase().includes(searchTerm)
        );
    }

    isDomainSelected(domainId) {
        return this.state.selectedDomainIds.includes(String(domainId));
    }

    isDomainSelectedAttr(domainId) {
        return this.isDomainSelected(domainId) ? true : undefined;
    }

    isTagSelected(tagId) {
        return this.state.selectedTagIds.includes(String(tagId));
    }

    isTagSelectedAttr(tagId) {
        return this.isTagSelected(tagId) ? true : undefined;
    }

    isTransitionSelected(transitionId) {
        return this.state.selectedTransitionIds.includes(String(transitionId));
    }

    isTransitionSelectedAttr(transitionId) {
        return this.isTransitionSelected(transitionId) ? true : undefined;
    }

    getDomainDropdownClass() {
        return this.state.domainDropdownOpen ? "dropdown o_matrix_domain_filter_dropdown show" : "dropdown o_matrix_domain_filter_dropdown";
    }

    getDomainDropdownMenuClass() {
        return this.state.domainDropdownOpen ? "dropdown-menu o_matrix_dropdown_menu show" : "dropdown-menu o_matrix_dropdown_menu";
    }

    getTagDropdownClass() {
        return this.state.tagDropdownOpen ? "dropdown o_matrix_tag_filter_dropdown show" : "dropdown o_matrix_tag_filter_dropdown";
    }

    getTagDropdownMenuClass() {
        return this.state.tagDropdownOpen ? "dropdown-menu o_matrix_dropdown_menu show" : "dropdown-menu o_matrix_dropdown_menu";
    }

    getTransitionDropdownClass() {
        return this.state.transitionDropdownOpen
            ? "dropdown o_matrix_transition_filter_dropdown show"
            : "dropdown o_matrix_transition_filter_dropdown";
    }

    getTransitionDropdownMenuClass() {
        return this.state.transitionDropdownOpen ? "dropdown-menu o_matrix_dropdown_menu show" : "dropdown-menu o_matrix_dropdown_menu";
    }

    isAnyDropdownOpen() {
        return this.state.domainDropdownOpen || this.state.tagDropdownOpen || this.state.transitionDropdownOpen;
    }

    isFromComponentDisabled() {
        return this.state.loadingFromComponents || !this.state.fromComponents.length;
    }

    isToComponentDisabled() {
        return this.state.loadingToComponents || !this.state.selectedFromComponentId;
    }

    getFromMetaClass() {
        return this.getSelectedFromComponent()
            ? "o_matrix_filter_meta"
            : "o_matrix_filter_meta o_matrix_filter_meta_placeholder";
    }

    getFromMetaText() {
        const component = this.getSelectedFromComponent();
        return component ? this.getComponentCountLabel(component) : "";
    }

    hasNoRelatedToComponents() {
        return Boolean(
            this.state.selectedFromComponentId &&
            !this.state.loadingToComponents &&
            !this.state.toComponents.length
        );
    }

    getToMetaClass() {
        if (this.getSelectedToComponent()) {
            return "o_matrix_filter_meta";
        }
        if (this.hasNoRelatedToComponents()) {
            return "o_matrix_filter_meta text-muted";
        }
        return "o_matrix_filter_meta o_matrix_filter_meta_placeholder";
    }

    getToMetaText() {
        const component = this.getSelectedToComponent();
        if (component) {
            return this.getComponentCountLabel(component);
        }
        if (this.hasNoRelatedToComponents()) {
            return this.getText("noRelatedComponents");
        }
        return "";
    }

    getPreviewSectionTitle() {
        const fromComponent = this.getSelectedFromComponent();
        const toComponent = this.getSelectedToComponent();
        const fromName = (this.state.matrix.fromComponentName || fromComponent?.name || "").toUpperCase();
        const toName = (this.state.matrix.toComponentName || toComponent?.name || "").toUpperCase();
        if (!fromName || !toName) {
            return this.getText("previewSectionTitle");
        }
        return `${this.getText("previewSectionTitle")}: ${fromName} vs ${toName}`;
    }

    getMatrixCornerTitle() {
        const fromName = this.state.matrix.fromComponentName || this.getSelectedFromComponent()?.name || "";
        const toName = this.state.matrix.toComponentName || this.getSelectedToComponent()?.name || "";
        if (!fromName || !toName) {
            return "";
        }
        return `${fromName} (Rows) \\ ${toName} (Columns)`;
    }

    shouldShowPreviewSection() {
        return this.state.loadingPreview || this.state.previewLoaded || Boolean(this.state.previewMessage);
    }

    getMatrixRows() {
        return this.state.matrix.rows || [];
    }

    getMatrixColumns() {
        return this.state.matrix.columns || [];
    }

    getPreviewRows() {
        return this.getMatrixRows().map((row, rowIndex) => ({
            ...row,
            cells: ((this.state.matrix.cells || [])[rowIndex] || []).map((isRelated, cellIndex) => ({
                key: `${row.id}-${cellIndex}`,
                isRelated,
            })),
        }));
    }

    getMatrixCellClass(isRelated) {
        return isRelated ? "o_matrix_boolean_cell o_matrix_boolean_true" : "o_matrix_boolean_cell o_matrix_boolean_false";
    }

    async onDomainOptionChange(ev) {
        const domainId = ev.target.value;
        if (!domainId) {
            return;
        }

        if (ev.target.checked) {
            if (!this.state.selectedDomainIds.includes(domainId)) {
                this.state.selectedDomainIds.push(domainId);
            }
        } else {
            this.state.selectedDomainIds = this.state.selectedDomainIds.filter(
                (selectedDomainId) => selectedDomainId !== domainId
            );
        }

        await this.loadFromComponents();
    }

    onDomainSearchInput(ev) {
        this.state.domainSearchTerm = ev.target.value || "";
    }

    onTagSearchInput(ev) {
        this.state.tagSearchTerm = ev.target.value || "";
    }

    onTransitionSearchInput(ev) {
        this.state.transitionSearchTerm = ev.target.value || "";
    }

    async removeSelectedDomain(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        const domainId = ev.currentTarget?.dataset?.domainId;
        if (!domainId) {
            return;
        }

        this.state.selectedDomainIds = this.state.selectedDomainIds.filter(
            (selectedDomainId) => selectedDomainId !== String(domainId)
        );
        await this.loadFromComponents();
    }

    async clearSelectedDomains(ev) {
        ev.stopPropagation();
        this.state.selectedDomainIds = [];
        await this.loadFromComponents();
    }

    onTagOptionChange(ev) {
        this.resetPreview();
        const tagId = ev.target.value;
        if (!tagId) {
            return;
        }
        if (ev.target.checked) {
            if (!this.state.selectedTagIds.includes(tagId)) {
                this.state.selectedTagIds.push(tagId);
            }
        } else {
            this.state.selectedTagIds = this.state.selectedTagIds.filter(
                (selectedTagId) => selectedTagId !== tagId
            );
        }
    }

    onTransitionOptionChange(ev) {
        this.resetPreview();
        const transitionId = ev.target.value;
        if (!transitionId) {
            return;
        }
        if (ev.target.checked) {
            if (!this.state.selectedTransitionIds.includes(transitionId)) {
                this.state.selectedTransitionIds.push(transitionId);
            }
        } else {
            this.state.selectedTransitionIds = this.state.selectedTransitionIds.filter(
                (selectedTransitionId) => selectedTransitionId !== transitionId
            );
        }
    }

    removeSelectedTag(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        this.resetPreview();
        const tagId = ev.currentTarget?.dataset?.tagId;
        if (!tagId) {
            return;
        }
        this.state.selectedTagIds = this.state.selectedTagIds.filter(
            (selectedTagId) => selectedTagId !== String(tagId)
        );
    }

    removeSelectedTransition(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        this.resetPreview();
        const transitionId = ev.currentTarget?.dataset?.transitionId;
        if (!transitionId) {
            return;
        }
        this.state.selectedTransitionIds = this.state.selectedTransitionIds.filter(
            (selectedTransitionId) => selectedTransitionId !== String(transitionId)
        );
    }

    clearSelectedTags(ev) {
        ev.stopPropagation();
        this.resetPreview();
        this.state.selectedTagIds = [];
    }

    clearSelectedTransitions(ev) {
        ev.stopPropagation();
        this.resetPreview();
        this.state.selectedTransitionIds = [];
    }

    async onFromComponentChange(ev) {
        this.state.selectedFromComponentId = ev.target.value || "";
        await this.loadToComponents();
    }

    onToComponentChange(ev) {
        this.state.selectedToComponentId = ev.target.value || "";
        this.resetPreview();
    }

    getSelectedFromComponent() {
        return this.state.fromComponents.find(
            (component) => String(component.id) === String(this.state.selectedFromComponentId)
        );
    }

    getSelectedToComponent() {
        return this.state.toComponents.find(
            (component) => String(component.id) === String(this.state.selectedToComponentId)
        );
    }

    getComponentCountLabel(component) {
        if (!component) {
            return "";
        }
        return `${_t("Total")} ${component.name}: ${component.count}`;
    }

    async onPreviewClick() {
        if (!this.state.selectedFromComponentId || !this.state.selectedToComponentId) {
            this.state.previewLoaded = false;
            this.state.previewMessage = this.getText("missingPreviewSelection");
            this.notification.add(this.state.previewMessage, { type: "warning" });
            return;
        }

        this.state.loadingPreview = true;
        this.state.previewLoaded = false;
        this.state.previewMessage = "";

        try {
            const result = await this.rpc("/matrix/relation/preview", {
                from_component_id: this.state.selectedFromComponentId,
                to_component_id: this.state.selectedToComponentId,
                tag_ids: this.state.selectedTagIds,
                transition_ids: this.state.selectedTransitionIds,
            });

            if (!result.success) {
                this.state.previewMessage = result.message || this.getText("noMatrixRows");
                this.notification.add(this.state.previewMessage, { type: "warning" });
                return;
            }

            const matrix = result.matrix || {};
            this.state.matrix = {
                fromComponentName: matrix.from_component_name || "",
                toComponentName: matrix.to_component_name || "",
                rows: matrix.rows || [],
                columns: matrix.columns || [],
                cells: matrix.cells || [],
                hasRelations: Boolean(matrix.has_relations),
            };
            this.state.previewLoaded = true;

            if (!this.state.matrix.rows.length || !this.state.matrix.columns.length) {
                this.state.previewMessage = this.getText("noMatrixRows");
                return;
            }

            if (!this.state.matrix.hasRelations) {
                this.state.previewMessage = this.getText("noMatrixRelations");
                return;
            }

            this.state.previewMessage = "";
        } catch (error) {
            console.error("Failed to load matrix preview:", error);
            this.state.previewMessage = _t("Failed to load preview.");
            this.notification.add(this.state.previewMessage, { type: "danger" });
        } finally {
            this.state.loadingPreview = false;
        }
    }
}

registry.category("actions").add(
    "twj_ea_enhancement.matrix_relation_report_client_action",
    MatrixRelationReport
);
