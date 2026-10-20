/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { useInputField } from "@web/views/fields/input_field_hook";
import { useNumpadDecimal } from "@web/views/fields/numpad_decimal_hook";
import {
    IntegerField,
    integerField,
} from "@web/views/fields/integer/integer_field";
import { parseInteger } from "@web/views/fields/parsers";
import { useState } from "@odoo/owl";

import {
    preventInvalidBeforeInput,
    preventInvalidDrop,
    preventInvalidPaste,
} from "./numeric_field_utils";

export class NumericIntegerField extends IntegerField {
    static template = "numeric_field_widgets.NumericIntegerField";
    static props = {
        ...IntegerField.props,
        allowNegative: { type: Boolean, optional: true },
        required: { type: Boolean, optional: true },
    };
    static defaultProps = {
        ...IntegerField.defaultProps,
        allowNegative: true,
        required: false,
    };

    setup() {
        this.state = useState({ hasFocus: false });

        // Register this field on the record so the Record validity patch can
        // apply the custom "zero is empty" required rule only when Odoo
        // actually checks validity (typically on Save).
        this.props.record._numericWidgetFields ??= new Set();
        this.props.record._numericWidgetFields.add(this.props.name);

        this.inputRef = useInputField({
            getValue: () => this.formattedValue,
            refName: "numpadDecimal",
            parse: (value) => this.parse(value),
        });
        useNumpadDecimal();
    }

    isEmptyValue(value) {
        return value === 0 || value === false || value === null || value === undefined;
    }

    parse(value) {
        const parsed = parseInteger(value);

        if (!this.props.allowNegative && parsed < 0) {
            throw new Error("Negative values are not allowed");
        }
        return parsed;
    }

    get formattedValue() {
        if (this.isEmptyValue(this.value)) {
            return "";
        }
        return super.formattedValue;
    }

    get validationOptions() {
        return {
            allowNegative: this.props.allowNegative,
            parser: parseInteger,
            isFloat: false,
        };
    }

    onBeforeInput(ev) {
        preventInvalidBeforeInput(ev, this.validationOptions);
    }

    onPaste(ev) {
        preventInvalidPaste(ev, this.validationOptions);
    }

    onDrop(ev) {
        preventInvalidDrop(ev, this.validationOptions);
    }
}

export const numericIntegerField = {
    ...integerField,
    component: NumericIntegerField,
    displayName: _t("Numeric Integer"),
    supportedOptions: [
        ...integerField.supportedOptions,
        {
            label: _t("Allow negative values"),
            name: "allow_negative",
            type: "boolean",
            default: true,
        },
    ],
    isEmpty: (record, fieldName) => {
        const value = record.data[fieldName];
        return value === false || value === null || value === undefined || value === 0;
    },
    extractProps: (fieldInfo, dynamicInfo) => ({
        ...integerField.extractProps(fieldInfo, dynamicInfo),
        required: Boolean(dynamicInfo.required),
        allowNegative:
            fieldInfo.options?.allow_negative !== undefined
                ? Boolean(fieldInfo.options.allow_negative)
                : true,
    }),
};

registry.category("fields").add("numeric_integer", numericIntegerField);
