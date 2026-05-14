/** @odoo-module **/

import { Component, onMounted, onWillStart, onWillUnmount, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";
import { useService } from "@web/core/utils/hooks";

const TIMELINE_QUARTERS = [_t("Q1"), _t("Q2"), _t("Q3"), _t("Q4")];

const LAYER_NAME_KEY_MAP = {
    global: "global",
    strategy: "strategy",
    business: "business",
    beneficiary_experience: "beneficiary_experience",
    application: "application",
    data: "data",
    technology: "technology",
    cybersecurity_structure: "cybersecurity_structure",
};

const DOMAIN_PRESENTATION_MAP = {
    global: { iconClass: "fa fa-globe", accentClass: "o_domain_global" },
    strategy: { iconClass: "fa fa-compass", accentClass: "o_domain_strategy" },
    business: { iconClass: "fa fa-shopping-bag", accentClass: "o_domain_business" },
    beneficiary_experience: { iconClass: "fa fa-bullseye", accentClass: "o_domain_cx" },
    application: { iconClass: "fa fa-th-large", accentClass: "o_domain_application" },
    data: { iconClass: "fa fa-database", accentClass: "o_domain_data" },
    technology: { iconClass: "fa fa-cog", accentClass: "o_domain_technology" },
    cybersecurity_structure: { iconClass: "fa fa-shield", accentClass: "o_domain_cybersecurity" },
};


class BuildingBlockRoadmapReport extends Component {
    static template = "twj_ea_enhancement.RoadmapReport";

    setup() {
        this.notification = useService("notification");
        this.rpc = useService("rpc");
        this.actionParams = this.props.action?.params || {};
        const currentLang = (session.user_context.lang || "").toLowerCase();
        this.isRTL = currentLang.startsWith("ar");
        this.recordContext = {
            sourceModel: this.actionParams.source_model || "",
            sourceRecordId: this.actionParams.source_record_id || false,
            initialLayerIds: (this.actionParams.initial_layer_ids || []).map((id) => String(id)),
            initialTagIds: (this.actionParams.initial_tag_ids || []).map((id) => String(id)),
            useRecordOnly: Boolean(this.actionParams.source_model && this.actionParams.source_record_id),
        };

        this.state = useState({
            layers: [],
            selectedLayerIds: [],
            layerDropdownOpen: false,
            layerSearchTerm: "",
            tags: [],
            selectedTagIds: [],
            tagDropdownOpen: false,
            tagSearchTerm: "",
            lines: [],
            filteredLines: [],
            rows: [],
            timelineYears: [],
            collapsedLayerIds: [],
            loadingLayers: false,
            loadingTags: false,
            loadingReport: false,
            message: "",
        });

        this.searchTimer = null;
        this.lastSearchRequestId = 0;
        this.onDocumentPointerDown = this.onDocumentPointerDown.bind(this);

        onWillStart(async () => {
            await this.loadLayers();
            await this.loadTags();
            if (this.state.selectedLayerIds.length) {
                await this.runSearch();
            }
        });

        onMounted(() => {
            document.addEventListener("pointerdown", this.onDocumentPointerDown, true);
        });

        onWillUnmount(() => {
            document.removeEventListener("pointerdown", this.onDocumentPointerDown, true);
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
            }
        });
    }

    async loadLayers() {
        this.state.loadingLayers = true;

        try {
            const result = await this.rpc("/building/block/roadmap/layers", {});
            this.state.layers = result.layers || [];
            this.state.selectedLayerIds = this.recordContext.initialLayerIds.length
                ? this.recordContext.initialLayerIds.filter((layerId) =>
                    this.state.layers.some((layer) => String(layer.id) === layerId)
                )
                : this.state.layers.map((layer) => String(layer.id));
        } catch (error) {
            console.error("Failed to load layers:", error);
            this.notification.add(_t("Failed to load layers."), { type: "danger" });
        } finally {
            this.state.loadingLayers = false;
        }
    }

    async loadTags() {
        this.state.loadingTags = true;

        try {
            const result = await this.rpc("/building/block/roadmap/tags", {});
            this.state.tags = result.tags || [];
            if (this.recordContext.initialTagIds.length) {
                this.state.selectedTagIds = this.recordContext.initialTagIds.filter((tagId) =>
                    this.state.tags.some((tag) => String(tag.id) === tagId)
                );
            }
        } catch (error) {
            console.error("Failed to load tags:", error);
            this.notification.add(_t("Failed to load tags."), { type: "danger" });
        } finally {
            this.state.loadingTags = false;
        }
    }

    toggleLayerDropdown() {
        if (this.state.loadingLayers) {
            return;
        }
        this.state.layerDropdownOpen = !this.state.layerDropdownOpen;
        if (this.state.layerDropdownOpen) {
            this.state.tagDropdownOpen = false;
        }
    }

    toggleTagDropdown() {
        if (this.state.loadingTags) {
            return;
        }
        this.state.tagDropdownOpen = !this.state.tagDropdownOpen;
        if (this.state.tagDropdownOpen) {
            this.state.layerDropdownOpen = false;
        }
    }

    closeLayerDropdown() {
        this.state.layerDropdownOpen = false;
    }

    closeTagDropdown() {
        this.state.tagDropdownOpen = false;
    }

    closeAllDropdowns() {
        this.closeLayerDropdown();
        this.closeTagDropdown();
    }

    onDocumentPointerDown(ev) {
        if (!this.el) {
            return;
        }
        const layerDropdown = this.el.querySelector(".o_domain_filter_dropdown");
        const tagDropdown = this.el.querySelector(".o_tag_filter_dropdown");

        if (this.state.layerDropdownOpen && layerDropdown && !layerDropdown.contains(ev.target)) {
            this.closeLayerDropdown();
        }
        if (this.state.tagDropdownOpen && tagDropdown && !tagDropdown.contains(ev.target)) {
            this.closeTagDropdown();
        }
    }

    getSelectedLayers() {
        return this.state.layers.filter((layer) =>
            this.state.selectedLayerIds.includes(String(layer.id))
        );
    }

    getReportTitle() {
        return _t("BUILDING BLOCK ROADMAP REPORT");
    }

    getReportSubtitle() {
        return _t("Track lifecycle evolution, align with transformation initiatives & identify gaps");
    }

    getRootDirection() {
        return this.isRTL ? "rtl" : "ltr";
    }

    getText(key) {
        const texts = {
            filterByDomain: _t("Filter by Domain"),
            filterByTag: _t("Filter by Tag (Portfolio)"),
            searchDomain: _t("Search domains..."),
            searchTag: _t("Search tags..."),
            selectLayersPlaceholder: _t("Select layers..."),
            selectLayers: _t("Select layers"),
            selectTags: _t("Select tags"),
            clear: _t("Clear"),
            loading: _t("Loading..."),
            all: _t("All"),
            legend: _t("LEGEND"),
            statusColorModel: _t("STATUS (Color Model)"),
            active: _t("Active"),
            sunset: _t("Sunset"),
            build: _t("Build"),
            retired: _t("Retired"),
            maintain: _t("Maintain"),
            planned: _t("Planned"),
            optimize: _t("Optimize"),
            kpiLayer: _t("KPI LAYER"),
            executiveView: _t("(Executive View)"),
            activeCount: _t("% BBs in Active"),
            sunsetCount: _t("% BBs in Sunset"),
            gapCount: _t("# of Gaps"),
            projectCount: _t("# of DT Projects"),
            visibleRecords: _t("Visible records"),
            of: _t("of"),
            uniqueVisibleGaps: _t("Unique visible gaps"),
            uniqueVisibleProjects: _t("Unique visible projects"),
            expandAll: _t("Expand All"),
            collapseAll: _t("Collapse All"),
            exportImage: _t("Export Image"),
            collapsedDomains: _t("domain(s) collapsed"),
            domain: _t("Domain"),
            buildingBlock: _t("Building Block (BB)"),
            tagPortfolio: _t("Tag (Portfolio)"),
            dtProject: _t("DT Project"),
            gaps: _t("Gaps"),
            loadingReport: _t("Loading report..."),
            noRowsForTags: _t("No roadmap rows match the selected tags."),
            allDomainsCollapsed: _t("All selected domains are collapsed."),
            selectLayersToLoad: _t("Select one or more layers to load roadmap rows."),
            remove: _t("Remove"),
        };
        return texts[key] || "";
    }

    getSelectedTags() {
        return this.state.tags.filter((tag) =>
            this.state.selectedTagIds.includes(String(tag.id))
        );
    }

    getVisibleLayers() {
        const searchTerm = (this.state.layerSearchTerm || "").trim().toLowerCase();
        if (!searchTerm) {
            return this.state.layers;
        }
        return this.state.layers.filter((layer) => (layer.name || "").toLowerCase().includes(searchTerm));
    }

    getVisibleTags() {
        const searchTerm = (this.state.tagSearchTerm || "").trim().toLowerCase();
        if (!searchTerm) {
            return this.state.tags;
        }
        return this.state.tags.filter((tag) => (tag.name || "").toLowerCase().includes(searchTerm));
    }

    getLayerKey(layerName) {
        const normalizedName = (layerName || "")
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        return LAYER_NAME_KEY_MAP[normalizedName] || null;
    }

    isLayerSelected(layerId) {
        return this.state.selectedLayerIds.includes(String(layerId));
    }

    isTagSelected(tagId) {
        return this.state.selectedTagIds.includes(String(tagId));
    }

    onLayerOptionChange(ev) {
        this.recordContext.useRecordOnly = false;
        const layerId = ev.target.value;

        if (!layerId) {
            return;
        }

        if (ev.target.checked) {
            if (!this.state.selectedLayerIds.includes(layerId)) {
                this.state.selectedLayerIds.push(layerId);
            }
        } else {
            this.state.selectedLayerIds = this.state.selectedLayerIds.filter(
                (selectedLayerId) => selectedLayerId !== layerId
            );
        }

        this.scheduleSearch();
    }

    onLayerSearchInput(ev) {
        this.state.layerSearchTerm = ev.target.value || "";
    }

    onTagOptionChange(ev) {
        this.recordContext.useRecordOnly = false;
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

        this.scheduleSearch();
    }

    onTagSearchInput(ev) {
        this.state.tagSearchTerm = ev.target.value || "";
    }

    removeSelectedLayer(ev) {
        this.recordContext.useRecordOnly = false;
        if (ev) {
            ev.stopPropagation();
            ev.preventDefault();
        }

        const layerId = ev?.currentTarget?.dataset?.layerId;
        if (!layerId) {
            return;
        }

        this.state.selectedLayerIds = this.state.selectedLayerIds.filter(
            (selectedLayerId) => selectedLayerId !== String(layerId)
        );
        this.scheduleSearch();
    }

    removeSelectedTag(ev) {
        this.recordContext.useRecordOnly = false;
        if (ev) {
            ev.stopPropagation();
            ev.preventDefault();
        }

        const tagId = ev?.currentTarget?.dataset?.tagId;
        if (!tagId) {
            return;
        }

        this.state.selectedTagIds = this.state.selectedTagIds.filter(
            (selectedTagId) => selectedTagId !== String(tagId)
        );
        this.scheduleSearch();
    }

    clearSelectedLayers(ev) {
        this.recordContext.useRecordOnly = false;
        if (ev) {
            ev.stopPropagation();
        }

        this.state.selectedLayerIds = [];
        this.state.lines = [];
        this.state.filteredLines = [];
        this.state.rows = [];
        this.state.timelineYears = [];
        this.state.collapsedLayerIds = [];
        this.state.message = "";

        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
    }

    clearSelectedTags(ev) {
        this.recordContext.useRecordOnly = false;
        if (ev) {
            ev.stopPropagation();
        }

        this.state.selectedTagIds = [];
        this.scheduleSearch();
    }

    scheduleSearch() {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }

        this.searchTimer = setTimeout(() => {
            this.runSearch();
        }, 300);
    }

    async runSearch() {
        if (!this.state.selectedLayerIds.length) {
            this.state.lines = [];
            this.state.filteredLines = [];
            this.state.rows = [];
            this.state.timelineYears = [];
            this.state.message = "";
            return;
        }

        this.state.loadingReport = true;
        this.state.message = "";

        const currentRequestId = ++this.lastSearchRequestId;

        try {
            const result = await this.rpc("/building/block/roadmap/search", {
                layer_ids: this.state.selectedLayerIds,
                tag_ids: this.state.selectedTagIds,
                source_model: this.recordContext.useRecordOnly ? this.recordContext.sourceModel : false,
                source_record_id: this.recordContext.useRecordOnly ? this.recordContext.sourceRecordId : false,
            });

            if (currentRequestId !== this.lastSearchRequestId) {
                return;
            }

            this.state.message = result.message || "";
            this.state.lines = result.lines || [];
            this.rebuildRows();
            this.state.collapsedLayerIds = [];

            if (!result.success) {
                this.notification.add(result.message || _t("Search failed."), {
                    type: "warning",
                });
            }
        } catch (error) {
            console.error("Search request failed:", error);
            this.notification.add(_t("Search request failed."), { type: "danger" });
        } finally {
            if (currentRequestId === this.lastSearchRequestId) {
                this.state.loadingReport = false;
            }
        }
    }

    rebuildRows() {
        const filteredLines = this.getFilteredLines();
        this.state.filteredLines = filteredLines;
        this.state.rows = this.buildRows(filteredLines);
    }

    getFilteredLines() {
        const selectedTagNames = this.getSelectedTagNames();
        return this.state.lines.filter((line) => (
            !selectedTagNames.length ||
            (line.tag_names || []).some((tagName) => selectedTagNames.includes(tagName))
        ));
    }

    getTimelineYears() {
        return this.state.timelineYears;
    }

    getTimelineColumns() {
        return this.state.timelineYears.flatMap((year) =>
            TIMELINE_QUARTERS.map((quarter) => `${quarter} ${year}`)
        );
    }

    getTimelineColumnCount() {
        return Math.max(1, this.getTimelineColumns().length);
    }

    getTableColumnCount() {
        return 5 + this.getTimelineColumnCount();
    }

    getTimelineTrackStyle() {
        return `grid-template-columns: repeat(${this.getTimelineColumnCount()}, minmax(52px, 1fr));`;
    }

    getVisibleRows() {
        if (!this.state.collapsedLayerIds.length) {
            return this.state.rows;
        }

        return this.state.rows.filter((row) => {
            if (!this.isLayerCollapsed(row.layerId)) {
                return true;
            }
            return row.showLayer;
        });
    }

    collapseAll() {
        this.state.collapsedLayerIds = this.state.selectedLayerIds.map(String);
    }

    expandAll() {
        this.state.collapsedLayerIds = [];
    }

    isLayerCollapsed(layerId) {
        return this.state.collapsedLayerIds.includes(String(layerId));
    }

    getCollapsedCount() {
        return this.state.collapsedLayerIds.length;
    }

    getSelectedTagNames() {
        return this.getSelectedTags().map((tag) => tag.name);
    }

    getRowGapsLabel(row) {
        return (row.gaps || []).join(", ");
    }

    getTotalBuildingBlockCount() {
        return this.state.filteredLines.length;
    }

    getActiveCount() {
        return this.state.filteredLines.filter((line) => line.change_type === "active").length;
    }

    getSunsetCount() {
        return this.state.filteredLines.filter((line) => line.change_type === "cancel").length;
    }

    formatPercentage(count, total) {
        if (!total) {
            return "0%";
        }
        return `${Math.round((count / total) * 100)}%`;
    }

    getActivePercentage() {
        return this.formatPercentage(this.getActiveCount(), this.getTotalBuildingBlockCount());
    }

    getSunsetPercentage() {
        return this.formatPercentage(this.getSunsetCount(), this.getTotalBuildingBlockCount());
    }

    getActiveSummary() {
        return `${this.getActiveCount()} ${this.getText("of")} ${this.getTotalBuildingBlockCount()}`;
    }

    getSunsetSummary() {
        return `${this.getSunsetCount()} ${this.getText("of")} ${this.getTotalBuildingBlockCount()}`;
    }

    getGapCount() {
        const gapNames = new Set();
        this.state.filteredLines.forEach((line) => {
            (line.gap_names || []).forEach((gapName) => {
                if (gapName) {
                    gapNames.add(gapName);
                }
            });
        });
        return gapNames.size;
    }

    getProjectCount() {
        const projectNames = new Set();
        this.state.filteredLines.forEach((line) => {
            if (line.project_names && line.project_names.length) {
                line.project_names.forEach((projectName) => {
                    if (projectName) {
                        projectNames.add(projectName);
                    }
                });
                return;
            }
            if (line.project_name) {
                line.project_name.split(",").map((name) => name.trim()).filter(Boolean).forEach((projectName) => {
                    projectNames.add(projectName);
                });
            }
        });
        return projectNames.size;
    }

    getQuarterIndex(dateString) {
        const date = new Date(dateString);
        return Math.floor(date.getUTCMonth() / 3);
    }

    buildTimelineYears(lines) {
        const datedLines = lines.filter((line) => line.start_date && line.end_date);
        if (!datedLines.length) {
            return [];
        }

        const startYears = datedLines.map((line) => new Date(line.start_date).getUTCFullYear());
        const endYears = datedLines.map((line) => new Date(line.end_date).getUTCFullYear());
        const minYear = Math.min(...startYears);
        const maxYear = Math.max(...endYears);

        return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
    }

    buildRows(lines) {
        this.state.timelineYears = this.buildTimelineYears(lines);

        if (!lines.length) {
            return [];
        }

        const firstTimelineYear = this.state.timelineYears[0];
        const rowsByLayerId = new Map();
        const layerOrder = [];

        lines.forEach((line) => {
            if (!rowsByLayerId.has(line.layer_id)) {
                rowsByLayerId.set(line.layer_id, new Map());
                layerOrder.push(line.layer_id);
            }

            const layerKey = this.getLayerKey(line.layer_name);
            const presentation = DOMAIN_PRESENTATION_MAP[layerKey] || {
                iconClass: "fa fa-folder-open",
                accentClass: "",
            };
            const layerRows = rowsByLayerId.get(line.layer_id);
            const rowKey = `${line.layer_id}-${line.root_entity_id || line.id}`;
            let groupedRow = layerRows.get(rowKey);

            if (!groupedRow) {
                groupedRow = {
                    id: rowKey,
                    layerId: String(line.layer_id),
                    layerName: line.layer_name,
                    iconClass: presentation.iconClass,
                    accentClass: presentation.accentClass,
                    name: line.root_entity_name || line.name,
                    tagNames: new Set(),
                    projectNames: new Set(),
                    gapNames: new Set(),
                    blocks: [],
                };
                layerRows.set(rowKey, groupedRow);
            }

            (line.tag_names || []).forEach((tagName) => {
                if (tagName) {
                    groupedRow.tagNames.add(tagName);
                }
            });
            (line.project_names || []).forEach((projectName) => {
                if (projectName) {
                    groupedRow.projectNames.add(projectName);
                }
            });
            (line.gap_names || []).forEach((gapName) => {
                if (gapName) {
                    groupedRow.gapNames.add(gapName);
                }
            });

            if (line.start_date && line.end_date && firstTimelineYear !== undefined) {
                const startDate = new Date(line.start_date);
                const endDate = new Date(line.end_date);
                const startYear = startDate.getUTCFullYear();
                const endYear = endDate.getUTCFullYear();
                const startQuarter = this.getQuarterIndex(line.start_date);
                const endQuarter = this.getQuarterIndex(line.end_date);
                const start = ((startYear - firstTimelineYear) * 4) + startQuarter;
                const end = ((endYear - firstTimelineYear) * 4) + endQuarter;

                groupedRow.blocks.push({
                    key: `${line.id}-transition`,
                    start,
                    span: Math.max(1, end - start + 1),
                    label: line.name,
                    changeType: line.change_type || "none",
                    className: `bg-${line.change_type || "none"}`,
                });
            }
        });

        const flattenedRows = [];

        for (const layerId of layerOrder) {
            const layerRows = Array.from((rowsByLayerId.get(layerId) || new Map()).values()).map((row) => ({
                ...row,
                tag: Array.from(row.tagNames).join(", "),
                project: Array.from(row.projectNames).join(", "),
                gaps: Array.from(row.gapNames),
                blocks: row.blocks.sort((left, right) => left.start - right.start),
            }));
            layerRows.forEach((row, rowIndex) => {
                flattenedRows.push({
                    ...row,
                    showLayer: rowIndex === 0,
                    rowSpan: this.isLayerCollapsed(String(layerId)) ? 1 : layerRows.length,
                });
            });
        }

        return flattenedRows;
    }
}


registry.category("actions").add(
    "twj_ea_enhancement.building_block_roadmap_report_client_action",
    BuildingBlockRoadmapReport
);
