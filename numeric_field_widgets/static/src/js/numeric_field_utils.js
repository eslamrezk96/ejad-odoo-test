/** @odoo-module **/

import { localization } from "@web/core/l10n/localization";

/**
 * Return the value that would exist in the input after replacing the current
 * selection with `insertedText`.
 */
export function getProspectiveValue(input, insertedText) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    return input.value.slice(0, start) + insertedText + input.value.slice(end);
}

/**
 * Odoo accepts the language separators and also falls back to the usual
 * comma/dot number representation in its numeric parsers.
 *
 * We intentionally do not allow +, =, mathematical operators, letters, etc.
 */
export function hasOnlyNumericCharacters(value, allowNegative) {
    if (value === "") {
        return true;
    }

    let minusCount = 0;
    const decimalPoint = localization.decimalPoint || ".";
    const thousandsSep = localization.thousandsSep || "";
    const whitespaceThousandsSep = /\s/.test(thousandsSep);

    for (const char of value) {
        if (/\d/.test(char)) {
            continue;
        }

        if (char === "-") {
            minusCount += 1;
            if (!allowNegative || minusCount > 1 || value.indexOf("-") !== 0) {
                return false;
            }
            continue;
        }

        if (char === decimalPoint || char === "." || char === ",") {
            continue;
        }

        if (thousandsSep && thousandsSep.includes(char)) {
            continue;
        }

        // Odoo treats a whitespace thousands separator as any whitespace.
        if (whitespaceThousandsSep && /\s/.test(char)) {
            continue;
        }

        return false;
    }

    return true;
}

/**
 * Validate a complete candidate value.
 *
 * `parser` is Odoo's own parseInteger/parseFloat, so localization and normal
 * Odoo parsing rules remain intact.
 */
export function isValidNumericCandidate(value, { allowNegative, parser, isFloat }) {
    if (value === "") {
        return true;
    }

    if (!hasOnlyNumericCharacters(value, allowNegative)) {
        return false;
    }

    // Allow temporary states needed while the user is still typing.
    const decimalPoint = localization.decimalPoint || ".";
    const temporaryValues = isFloat
        ? ["-", decimalPoint, ".", `-${decimalPoint}`, "-."]
        : ["-"];

    if (temporaryValues.includes(value)) {
        return allowNegative || value !== "-";
    }

    try {
        const parsed = parser(value);
        if (!allowNegative && parsed < 0) {
            return false;
        }
        return Number.isFinite(parsed);
    } catch {
        return false;
    }
}

/**
 * Block invalid keyboard/input insertions before they reach the input.
 */
export function preventInvalidBeforeInput(ev, options) {
    // Deletion, history operations, etc. have no inserted text and must work.
    if (ev.data === null || ev.data === undefined) {
        return;
    }

    // Paste is validated explicitly by the paste handler so we can reject the
    // whole clipboard payload in one place.
    if (ev.inputType === "insertFromPaste") {
        return;
    }

    const candidate = getProspectiveValue(ev.target, ev.data);
    if (!isValidNumericCandidate(candidate, options)) {
        ev.preventDefault();
    }
}

/**
 * Reject the entire paste if the resulting field value is not valid.
 */
export function preventInvalidPaste(ev, options) {
    const pastedText = ev.clipboardData?.getData("text") ?? "";
    const candidate = getProspectiveValue(ev.target, pastedText);
    if (!isValidNumericCandidate(candidate, options)) {
        ev.preventDefault();
    }
}

/**
 * Reject drag/drop text for the same reason we reject invalid paste payloads.
 */
export function preventInvalidDrop(ev, options) {
    const droppedText = ev.dataTransfer?.getData("text") ?? "";
    if (!droppedText) {
        return;
    }
    const candidate = getProspectiveValue(ev.target, droppedText);
    if (!isValidNumericCandidate(candidate, options)) {
        ev.preventDefault();
    }
}
