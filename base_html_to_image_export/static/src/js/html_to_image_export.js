(function () {
    if (window.__HI_EXPORT_LOADED__) {
        return;
    }
    window.__HI_EXPORT_LOADED__ = true;

    // Create the loading overlay once and reuse it.
    function ensureLoadingOverlay() {
        let overlay = document.getElementById("o_hi_export_loading_overlay");
        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");
        overlay.id = "o_hi_export_loading_overlay";
        overlay.innerHTML = `
            <div class="o_hi_export_loading_box">
                <div class="o_hi_export_spinner"></div>
                <div class="o_hi_export_loading_text">Preparing image export...</div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // Show the loading overlay.
    function showLoading() {
        const overlay = ensureLoadingOverlay();
        overlay.classList.add("show");
    }

    // Hide the loading overlay.
    function hideLoading() {
        const overlay = document.getElementById("o_hi_export_loading_overlay");
        if (overlay) {
            overlay.classList.remove("show");
        }
    }

    // Wait for a short time before the next step.
    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Wait for the next browser render frame.
    function nextFrame() {
        return new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }

    // Wait until web fonts are ready.
    async function ensureFontsReady() {
        if (document.fonts && document.fonts.ready) {
            try {
                await document.fonts.ready;
            } catch (_e) {
                // ignore
            }
        }
    }

    // Download the final SVG blob.
    function triggerDownload(blob, filename) {
        const url = window.URL.createObjectURL(blob);

        try {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename || "export.svg";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            window.URL.revokeObjectURL(url);
        }
    }

    // Convert an image URL into a data URL.
    async function urlToDataUrl(url) {
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) {
            throw new Error(`Failed to load image: ${url}`);
        }

        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Read the html-to-image library from the global scope.
    function getHtmlToImageLib() {
        if (window.htmlToImage) {
            return window.htmlToImage;
        }
        throw new Error(
            "Local html-to-image library is not loaded. Load local.js before html_to_image_export.js."
        );
    }

    // Safely test whether an element matches a selector.
    function selectorMatches(el, selector) {
        if (!el || !selector || typeof el.matches !== "function") {
            return false;
        }
        try {
            return el.matches(selector);
        } catch (_e) {
            return false;
        }
    }

    // Copy computed styles from the source node to the clone.
    function copyComputedStyle(source, target) {
        const computed = window.getComputedStyle(source);
        let cssText = computed.cssText;
        if (!cssText) {
            cssText = Array.from(computed)
                .map((name) => `${name}:${computed.getPropertyValue(name)};`)
                .join("");
        }
        target.style.cssText = cssText;
    }

    // Copy live state for input-like elements and canvas nodes.
    function copyInputLikeState(source, target) {
        const tag = source.tagName;

        if (tag === "TEXTAREA") {
            target.textContent = source.value;
        } else if (tag === "INPUT") {
            const type = (source.getAttribute("type") || "text").toLowerCase();

            if (
                [
                    "text",
                    "search",
                    "email",
                    "url",
                    "tel",
                    "number",
                    "date",
                    "time",
                    "datetime-local",
                    "password",
                ].includes(type)
            ) {
                target.setAttribute("value", source.value || "");
            }

            if (["checkbox", "radio"].includes(type) && source.checked) {
                target.setAttribute("checked", "checked");
            }
        } else if (tag === "SELECT") {
            const sourceOptions = source.options || [];
            const targetOptions = target.options || [];
            for (let i = 0; i < sourceOptions.length; i++) {
                if (targetOptions[i]) {
                    targetOptions[i].selected = sourceOptions[i].selected;
                }
            }
        } else if (tag === "CANVAS") {
            try {
                const dataUrl = source.toDataURL();
                const img = document.createElement("img");
                img.src = dataUrl;
                img.width = source.width;
                img.height = source.height;
                target.replaceWith(img);
                return img;
            } catch (_e) {
                // ignore
            }
        }

        return target;
    }

    // Turn a style declaration into CSS text.
    function styleToCssText(style) {
        return style.cssText || Array.from(style)
            .map((name) => `${name}:${style.getPropertyValue(name)};`)
            .join("");
    }

    // Extract real text from pseudo-element content.
    function extractPseudoText(content) {
        if (
            !content ||
            content === "none" ||
            content === "normal" ||
            content === '""' ||
            content === "''"
        ) {
            return "";
        }
        return content.replace(/^['"]|['"]$/g, "");
    }

    // Check if a pseudo-element has visible content or styling.
    function pseudoHasRenderableStyle(style) {
        const content = style.getPropertyValue("content");
        const hasTextContent =
            content &&
            content !== "none" &&
            content !== "normal" &&
            content !== '""' &&
            content !== "''";

        const width = parseFloat(style.getPropertyValue("width")) || 0;
        const height = parseFloat(style.getPropertyValue("height")) || 0;
        const hasBox = width > 0 || height > 0;

        const hasBorder =
            style.getPropertyValue("border-top-width") !== "0px" ||
            style.getPropertyValue("border-right-width") !== "0px" ||
            style.getPropertyValue("border-bottom-width") !== "0px" ||
            style.getPropertyValue("border-left-width") !== "0px";

        const bg = style.getPropertyValue("background-color");
        const hasBackground =
            bg &&
            bg !== "transparent" &&
            bg !== "rgba(0, 0, 0, 0)";

        return hasTextContent || hasBox || hasBorder || hasBackground;
    }

    // Build a real DOM node for ::before or ::after.
    function createPseudoClone(source, pseudo) {
        const pseudoStyle = window.getComputedStyle(source, pseudo);

        if (!pseudoHasRenderableStyle(pseudoStyle)) {
            return null;
        }

        const el = document.createElement("span");
        el.setAttribute(
            "data-export-pseudo",
            pseudo === "::before" ? "before" : "after"
        );

        el.style.cssText = styleToCssText(pseudoStyle);
        el.style.pointerEvents = "none";

        const text = extractPseudoText(pseudoStyle.getPropertyValue("content"));
        if (text) {
            el.textContent = text;
        }

        if (pseudoStyle.display === "inline") {
            el.style.display = "block";
        }

        return el;
    }

    // Copy styles and pseudo-elements through the whole tree.
    function inlineStylesRecursively(source, target) {
        const effectiveTarget = copyInputLikeState(source, target);
        copyComputedStyle(source, effectiveTarget);

        const isElementPair =
            source.nodeType === Node.ELEMENT_NODE &&
            effectiveTarget.nodeType === Node.ELEMENT_NODE;
        const skipPseudoClone =
            isElementPair &&
            source.hasAttribute &&
            source.hasAttribute("data-export-skip-pseudo");

        if (isElementPair && !skipPseudoClone) {
            const beforePseudo = createPseudoClone(source, "::before");
            if (beforePseudo) {
                effectiveTarget.insertBefore(beforePseudo, effectiveTarget.firstChild);
            }
        }

        const sourceChildren = Array.from(source.childNodes);
        const targetChildren = Array.from(effectiveTarget.childNodes).filter((child) => {
            return !(
                child.nodeType === Node.ELEMENT_NODE &&
                child.hasAttribute &&
                child.hasAttribute("data-export-pseudo")
            );
        });

        for (let i = 0; i < sourceChildren.length; i++) {
            const sChild = sourceChildren[i];
            const tChild = targetChildren[i];
            if (!tChild) {
                continue;
            }

            if (
                sChild.nodeType === Node.ELEMENT_NODE &&
                tChild.nodeType === Node.ELEMENT_NODE
            ) {
                inlineStylesRecursively(sChild, tChild);
            }
        }

        if (isElementPair && !skipPseudoClone) {
            const afterPseudo = createPseudoClone(source, "::after");
            if (afterPseudo) {
                effectiveTarget.appendChild(afterPseudo);
            }
        }
    }

    // Hide elements that should not appear in the export.
    function hideElementsInClone(scopeNode, selectors) {
        if (!scopeNode || !selectors) {
            return;
        }

        selectors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((selector) => {
                if (selectorMatches(scopeNode, selector)) {
                    scopeNode.style.setProperty("display", "none", "important");
                }
                try {
                    scopeNode.querySelectorAll(selector).forEach((el) => {
                        el.style.setProperty("display", "none", "important");
                    });
                } catch (_e) {
                    // invalid selector
                }
            });
    }

    // Remove clipping and size limits for full-content export.
    function unclipElement(el) {
        const computed = window.getComputedStyle(el);

        if (computed.display === "inline" || computed.display === "contents") {
            return;
        }

        const overflowXNeedsFix = ["auto", "scroll", "hidden", "clip"].includes(computed.overflowX);
        const overflowYNeedsFix = ["auto", "scroll", "hidden", "clip"].includes(computed.overflowY);
        const overflowNeedsFix = ["auto", "scroll", "hidden", "clip"].includes(computed.overflow);
        const hasHorizontalClip = el.scrollWidth > el.clientWidth + 1;
        const hasVerticalClip = el.scrollHeight > el.clientHeight + 1;
        const shouldFixX = overflowNeedsFix || overflowXNeedsFix || hasHorizontalClip;
        const shouldFixY = overflowNeedsFix || overflowYNeedsFix || hasVerticalClip;

        if (!shouldFixX && !shouldFixY) {
            if (computed.position === "sticky") {
                el.style.position = "relative";
                el.style.top = "auto";
                el.style.bottom = "auto";
            }
            return;
        }

        el.style.setProperty("overflow", "visible", "important");
        el.style.setProperty("overflow-x", "visible", "important");
        el.style.setProperty("overflow-y", "visible", "important");

        if (shouldFixX) {
            const nextWidth = Math.max(el.scrollWidth || 0, el.offsetWidth || 0, el.clientWidth || 0);
            if (nextWidth > 0) {
                el.style.setProperty("width", `${Math.ceil(nextWidth)}px`, "important");
            }
            el.style.setProperty("max-width", "none", "important");
            el.style.setProperty("min-width", "0", "important");
        }

        if (shouldFixY) {
            const nextHeight = Math.max(el.scrollHeight || 0, el.offsetHeight || 0, el.clientHeight || 0);
            if (nextHeight > 0) {
                el.style.setProperty("height", `${Math.ceil(nextHeight)}px`, "important");
            }
            el.style.setProperty("max-height", "none", "important");
            el.style.setProperty("min-height", "0", "important");
        }

        if (computed.position === "sticky") {
            el.style.position = "relative";
            el.style.top = "auto";
            el.style.bottom = "auto";
        }
    }

    // Apply unclipping to the node and all of its descendants.
    function expandScrollableTree(node) {
        [node, ...Array.from(node.querySelectorAll("*"))].forEach((el) => {
            unclipElement(el);
        });
    }

    // Pick the best nodes to estimate the final width.
    function getStableWidthCandidates(node) {
        const result = [];

        const reportTables = (typeof node.matches === "function" && node.matches(".report-tables"))
            ? node
            : node.querySelector(".report-tables");

        if (reportTables) {
            result.push(reportTables);

            const title = reportTables.querySelector("h1, h2, h3, h4, h5, h6");
            if (title) {
                result.push(title);
            }

            const table = reportTables.querySelector("table");
            if (table) {
                result.push(table);
            }
        }

        if (!result.length) {
            result.push(...Array.from(node.children));
        }

        if (!result.length) {
            result.push(node);
        }

        return result;
    }

    // Measure a stable export width.
    function collectStableWidth(node) {
        let width = 0;

        const candidates = getStableWidthCandidates(node);

        candidates.forEach((el) => {
            if (!(el instanceof Element)) {
                return;
            }

            const rect = el.getBoundingClientRect();

            width = Math.max(
                width,
                rect.width || 0,
                el.scrollWidth || 0,
                el.offsetWidth || 0,
                el.clientWidth || 0
            );
        });

        return Math.ceil(width) + 100;
    }

    // Measure the final export width and height.
    function collectDeepDimensions(node) {
        const baseRect = node.getBoundingClientRect();

        let maxHeight = Math.max(
            baseRect.height || 0,
            node.scrollHeight || 0,
            node.offsetHeight || 0,
            node.clientHeight || 0
        );

        [node, ...Array.from(node.querySelectorAll("*"))].forEach((el) => {
            if (!(el instanceof Element)) {
                return;
            }

            const rect = el.getBoundingClientRect();

            if (!rect.width && !rect.height) {
                return;
            }

            const bottom = rect.bottom - baseRect.top;

            maxHeight = Math.max(
                maxHeight,
                bottom,
                el.scrollHeight || 0,
                el.offsetHeight || 0,
                el.clientHeight || 0
            );
        });

        return {
            width: collectStableWidth(node),
            height: Math.ceil(maxHeight),
        };
    }

    // Create an off-screen sandbox for clone preparation.
    function makeSandbox() {
        const sandbox = document.createElement("div");
        sandbox.className = "o_hi_export_sandbox";
        sandbox.style.position = "fixed";
        sandbox.style.left = "-100000px";
        sandbox.style.top = "0";
        sandbox.style.zIndex = "-1";
        sandbox.style.pointerEvents = "none";
        sandbox.style.opacity = "1";
        sandbox.style.background = "transparent";
        sandbox.style.overflow = "visible";
        sandbox.style.width = "auto";
        sandbox.style.height = "auto";
        sandbox.style.maxWidth = "none";
        sandbox.style.maxHeight = "none";
        sandbox.style.contain = "layout style paint";
        return sandbox;
    }

    // Inline image sources so the export is self-contained.
    async function inlineImagesAsDataUrl(node) {
        const images = node.querySelectorAll("img");

        for (const img of images) {
            const src = img.getAttribute("src");
            if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
                continue;
            }

            try {
                const absoluteSrc = new URL(src, window.location.href).href;
                img.setAttribute("src", await urlToDataUrl(absoluteSrc));
            } catch (error) {
                console.warn("Could not inline image for export:", src, error);
            }
        }
    }

    // Normalize text boxes inside table cells before export.
    function normalizeTextBoxesForExport(root) {
        root.querySelectorAll("table tbody > tr > td > div").forEach((el) => {
            el.style.setProperty("width", "100%", "important");
            el.style.setProperty("max-width", "100%", "important");
            el.style.setProperty("min-width", "0", "important");
            el.style.setProperty("box-sizing", "border-box", "important");
        });

        root.querySelectorAll("table tbody > tr > td > div > span").forEach((el) => {
            if (el.closest(".o_domain_toggle")) {
                return;
            }
            el.style.setProperty("display", "block", "important");
            el.style.setProperty("width", "100%", "important");
            el.style.setProperty("max-width", "100%", "important");
            el.style.setProperty("min-width", "0", "important");
            el.style.setProperty("box-sizing", "border-box", "important");
            el.style.setProperty("white-space", "normal", "important");
            el.style.setProperty("overflow-wrap", "anywhere", "important");
            el.style.setProperty("word-break", "break-word", "important");
        });
    }

    function isBuildingBlockRoadmapExport(root) {
        return Boolean(
            root &&
            (
                root.id === "o_building_block_roadmap_export_root" ||
                root.querySelector("#o_building_block_roadmap_export_root")
            )
        );
    }

    function normalizeRoadmapTableForExport(root) {
        if (!isBuildingBlockRoadmapExport(root)) {
            return;
        }

        const table = root.querySelector(".o_roadmap_table");
        if (!table) {
            return;
        }

        const borderColor = "#d9e1ef";
        // table.style.setProperty("border-collapse", "separate", "important");
        table.style.setProperty("border-spacing", "0", "important");

        table.querySelectorAll("th, td").forEach((cell) => {
            cell.style.setProperty("border", "0", "important");
            cell.style.setProperty("border-top", "0", "important");
            cell.style.setProperty("border-right", "0", "important");
            cell.style.setProperty("border-bottom", "0", "important");
            cell.style.setProperty("border-left", "0", "important");
            cell.style.setProperty("border-block", "0", "important");
            cell.style.setProperty("border-inline", "0", "important");
            cell.style.setProperty("border-block-start", "0", "important");
            cell.style.setProperty("border-block-end", "0", "important");
            cell.style.setProperty("border-inline-start", "0", "important");
            cell.style.setProperty("border-inline-end", "0", "important");
            cell.style.setProperty("border-style", "none", "important");
            cell.style.setProperty("border-width", "0", "important");
            cell.style.setProperty("border-color", "transparent", "important");
            cell.style.setProperty("box-shadow", "none", "important");
        });

        table.querySelectorAll("thead th").forEach((cell) => {
            cell.style.setProperty("border-bottom", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-top", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-block-end", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-inline-start", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-inline-end", `1px solid ${borderColor}`, "important");
        });

        table.querySelectorAll("tbody td, tbody th").forEach((cell) => {
            cell.style.setProperty("border-inline-start", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-inline-end", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-bottom", `1px solid ${borderColor}`, "important");
            cell.style.setProperty("border-block-end", `1px solid ${borderColor}`, "important");
        });

        table.querySelectorAll(".o_domain_toggle").forEach((toggle) => {
            toggle.style.setProperty("box-sizing", "border-box", "important");
            toggle.style.setProperty("height", "100%", "important");
            toggle.style.setProperty("min-height", "0", "important");
        });
    }

    function normalizeRoadmapTimelineForExport(sourceRoot, cloneRoot) {
        if (!isBuildingBlockRoadmapExport(sourceRoot) || !isBuildingBlockRoadmapExport(cloneRoot)) {
            return;
        }

        cloneRoot.querySelectorAll(".o_timeline_cell").forEach((cell) => {
            cell.style.setProperty("padding-top", "8px", "important");
            cell.style.setProperty("padding-right", "0", "important");
            cell.style.setProperty("padding-bottom", "8px", "important");
            cell.style.setProperty("padding-left", "0", "important");
        });

        const sourceTracks = Array.from(sourceRoot.querySelectorAll(".o_timeline_track"));
        const cloneTracks = Array.from(cloneRoot.querySelectorAll(".o_timeline_track"));
        cloneTracks.forEach((track, index) => {
            const sourceTrack = sourceTracks[index];
            track.style.setProperty("gap", "0", "important");
            track.style.setProperty("column-gap", "0", "important");
            track.style.setProperty("row-gap", "0", "important");
            track.style.setProperty("padding", "0", "important");
            track.style.setProperty("margin", "0", "important");
            track.style.setProperty("width", "100%", "important");
            track.style.setProperty("box-sizing", "border-box", "important");
            if (sourceTrack?.style?.gridTemplateColumns) {
                track.style.setProperty(
                    "grid-template-columns",
                    sourceTrack.style.gridTemplateColumns,
                    "important"
                );
            }
        });

        const sourceBlocks = Array.from(sourceRoot.querySelectorAll(".o_timeline_block"));
        const cloneBlocks = Array.from(cloneRoot.querySelectorAll(".o_timeline_block"));
        cloneBlocks.forEach((block, index) => {
            const sourceBlock = sourceBlocks[index];
            block.style.setProperty("margin", "0", "important");
            block.style.setProperty("padding-top", "4px", "important");
            block.style.setProperty("padding-right", "6px", "important");
            block.style.setProperty("padding-bottom", "4px", "important");
            block.style.setProperty("padding-left", "0", "important");
            block.style.setProperty("justify-content", "flex-start", "important");
            block.style.setProperty("box-sizing", "border-box", "important");
            block.style.setProperty("width", "auto", "important");
            block.style.setProperty("min-width", "0", "important");
            if (sourceBlock?.style?.gridColumn) {
                block.style.setProperty("grid-column", sourceBlock.style.gridColumn, "important");
            }
        });

        cloneRoot.querySelectorAll(".o_timeline_block > span").forEach((label) => {
            label.style.setProperty("padding-left", "6px", "important");
            label.style.setProperty("margin", "0", "important");
            label.style.setProperty("box-sizing", "border-box", "important");
        });
    }

    function syncRoadmapRowHeightsFromSource(sourceRoot, cloneRoot) {
        if (!isBuildingBlockRoadmapExport(sourceRoot) || !isBuildingBlockRoadmapExport(cloneRoot)) {
            return;
        }

        const sourceTable = sourceRoot.querySelector(".o_roadmap_table");
        const cloneTable = cloneRoot.querySelector(".o_roadmap_table");
        if (!sourceTable || !cloneTable) {
            return;
        }

        const sourceRows = Array.from(sourceTable.querySelectorAll("tbody > tr"));
        const cloneRows = Array.from(cloneTable.querySelectorAll("tbody > tr"));

        cloneRows.forEach((cloneRow, index) => {
            const sourceRow = sourceRows[index];
            if (!sourceRow) {
                return;
            }

            const rowHeight = sourceRow.getBoundingClientRect().height;
            if (!rowHeight) {
                return;
            }

            cloneRow.style.setProperty("height", `${rowHeight}px`, "important");
            cloneRow.style.setProperty("min-height", `${rowHeight}px`, "important");

            Array.from(cloneRow.cells).forEach((cell) => {
                if (cell.classList.contains("o_domain_cell") && cell.hasAttribute("rowspan")) {
                    return;
                }
                cell.style.setProperty("height", `${rowHeight}px`, "important");
                cell.style.setProperty("min-height", `${rowHeight}px`, "important");
                cell.style.setProperty("vertical-align", "middle", "important");
            });
        });

        cloneRows.forEach((row, index) => {
            const domainCell = row.querySelector("td.o_domain_cell[rowspan]");
            if (!domainCell) {
                return;
            }

            const sourceDomainCell = sourceRows[index]?.querySelector("td.o_domain_cell[rowspan]");
            if (!sourceDomainCell) {
                return;
            }

            const span = parseInt(domainCell.getAttribute("rowspan"), 10);
            if (!span || span < 2) {
                return;
            }

            const sourceDomainHeight = sourceDomainCell.getBoundingClientRect().height;
            if (!sourceDomainHeight) {
                return;
            }

            domainCell.style.setProperty("height", `${sourceDomainHeight}px`, "important");
            domainCell.style.setProperty("min-height", `${sourceDomainHeight}px`, "important");
            domainCell.style.setProperty("vertical-align", "middle", "important");
        });
    }

    // Build and prepare the clone that will be exported.
    async function buildPreparedClone(sourceNode, opts) {
        const sandbox = makeSandbox();
        const clone = sourceNode.cloneNode(true);

        inlineStylesRecursively(sourceNode, clone);
        hideElementsInClone(clone, opts.hideSelectors);

        clone.classList.add("export-mode");
        clone.classList.add(
            opts.exportLayout === "content" ? "export-content-layout" : "export-viewport-layout"
        );

        clone.style.setProperty("margin", "0", "important");
        clone.style.setProperty("box-sizing", "border-box", "important");
        clone.style.setProperty("max-width", "none", "important");
        clone.style.setProperty("max-height", "none", "important");

        sandbox.appendChild(clone);
        document.body.appendChild(sandbox);

        await ensureFontsReady();
        await nextFrame();
        await wait(40);

        if (opts.exportLayout === "content") {
            expandScrollableTree(clone);
            clone.style.setProperty("overflow", "visible", "important");
            clone.style.setProperty("overflow-x", "visible", "important");
            clone.style.setProperty("overflow-y", "visible", "important");
            clone.style.setProperty("height", "auto", "important");
            clone.style.setProperty("max-height", "none", "important");
            clone.style.setProperty("min-height", "0", "important");
        }

        normalizeTextBoxesForExport(clone);
        normalizeRoadmapTableForExport(clone);
        normalizeRoadmapTimelineForExport(sourceNode, clone);
        await inlineImagesAsDataUrl(clone);
        await nextFrame();
        await wait(60);
        syncRoadmapRowHeightsFromSource(sourceNode, clone);
        await nextFrame();
        await wait(20);

        const rawDims = collectDeepDimensions(clone);
        const extraLeft = opts.extraLeft || 0;

        const dims = {
            width: rawDims.width + extraLeft,
            height: rawDims.height,
        };

        if (extraLeft) {
            clone.style.setProperty("transform", `translateX(${extraLeft}px)`, "important");
            clone.style.setProperty("transform-origin", "top left", "important");
        }

        clone.style.setProperty("width", `${dims.width}px`, "important");
        clone.style.setProperty("height", `${dims.height}px`, "important");
        clone.style.setProperty("max-width", "none", "important");
        clone.style.setProperty("max-height", "none", "important");

        sandbox.style.width = `${dims.width}px`;
        sandbox.style.height = `${dims.height}px`;

        await nextFrame();
        await wait(60);

        return {
            sandbox,
            clone,
            dims,
            cleanup() {
                sandbox.remove();
            },
        };
    }

    // Serialize the prepared node into an SVG string.
    function serializeNodeToSvg(node, width, height, backgroundColor) {
        const clone = node.cloneNode(true);
        const serializedXhtml = new XMLSerializer().serializeToString(clone);
        const bg = backgroundColor || "transparent";
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="0" y="0" width="100%" height="100%" fill="${bg}"/>
    <foreignObject x="0" y="0" width="100%" height="100%">${serializedXhtml}</foreignObject>
</svg>`;
        return svg;
    }

    // Convert an SVG string into a Blob.
    function svgStringToBlob(svg) {
        return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    }

    // Read export options from the button dataset.
    function normalizeOptions(btn) {
        return {
            filename: btn.dataset.filename || "export.svg",
            selector: btn.dataset.selector || "#export-root",
            exportLayout: btn.dataset.exportLayout || "viewport",
            pixelRatio: btn.dataset.pixelRatio ? parseFloat(btn.dataset.pixelRatio) : 2,
            backgroundColor: btn.dataset.backgroundColor || "",
            cacheBust: btn.dataset.cacheBust === "1",
            hideSelectors: btn.dataset.hideSelectors || ".o_hi_export_btn",
            skipAutoScale: btn.dataset.skipAutoScale === "1",
            extraLeft: btn.dataset.exportExtraLeft ? parseInt(btn.dataset.exportExtraLeft, 10) : 0,
        };
    }

    // Export the prepared clone using html-to-image.
    async function exportWithHtmlToImage(node, dims, opts) {
        const htmlToImage = getHtmlToImageLib();
        const common = {
            cacheBust: opts.cacheBust,
            pixelRatio: opts.pixelRatio,
            backgroundColor: opts.backgroundColor || undefined,
            skipAutoScale: opts.skipAutoScale,
            width: dims.width,
            height: dims.height,
            style: {
                width: `${dims.width}px`,
                height: `${dims.height}px`,
                maxWidth: "none",
                maxHeight: "none",
                overflow: "visible",
            },
        };

        const dataUrl = await htmlToImage.toSvg(node, common);
        const resp = await fetch(dataUrl);
        return await resp.blob();
    }

    // Fallback SVG export if the main exporter fails.
    async function fallbackToSvg(node, dims, opts) {
        const svg = serializeNodeToSvg(node, dims.width, dims.height, opts.backgroundColor);
        return svgStringToBlob(svg);
    }

    // Try the main SVG export, then fall back if needed.
    async function exportPreparedClone(prepared, opts) {
        const effective = {
            ...opts,
            filename: opts.filename || "export.svg",
        };

        try {
            const blob = await exportWithHtmlToImage(prepared.clone, prepared.dims, effective);
            return { blob, effective };
        } catch (error) {
            console.warn("html-to-image SVG export failed; using fallback SVG exporter.", error);
        }

        const blob = await fallbackToSvg(prepared.clone, prepared.dims, effective);
        return { blob, effective };
    }

    // Handle a click on an export button.
    async function handleExportButton(btn) {
        if (btn.dataset.loading === "1") {
            return;
        }

        const opts = normalizeOptions(btn);
        const sourceNode = document.querySelector(opts.selector);

        if (!sourceNode) {
            throw new Error(`Target element not found for selector: ${opts.selector}`);
        }

        btn.dataset.loading = "1";
        btn.disabled = true;
        showLoading();

        let prepared = null;

        try {
            prepared = await buildPreparedClone(sourceNode, opts);
            const { blob, effective } = await exportPreparedClone(prepared, opts);

            triggerDownload(blob, effective.filename);
            await wait(200);
        } finally {
            if (prepared) {
                prepared.cleanup();
            }
            hideLoading();
            btn.disabled = false;
            btn.dataset.loading = "0";
        }
    }

    // Listen for clicks on export buttons.
    document.addEventListener("click", async function (ev) {
        const btn = ev.target.closest(".o_hi_export_btn");
        if (!btn) {
            return;
        }

        ev.preventDefault();

        try {
            await handleExportButton(btn);
        } catch (error) {
            console.error("HTML export failed:", error);
            hideLoading();
            btn.disabled = false;
            btn.dataset.loading = "0";
            alert("Export failed.\n\n" + (error && error.message ? error.message : error));
        }
    });
})();
