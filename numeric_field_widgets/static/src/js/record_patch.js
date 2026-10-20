/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Record } from "@web/model/relational_model/record";

/**
 * Odoo 17 intentionally skips integer/float/monetary fields in
 * Record._checkValidity(). Our widgets need a different rule: when such a
 * field is required, zero is considered empty.
 *
 * The widget registers its field name on the record. We only mark the field
 * invalid when Odoo itself asks the record to check validity (normally when
 * the user clicks Save). This avoids showing the required error immediately
 * when an empty form is opened.
 */
patch(Record.prototype, {
    _checkValidity(options = {}) {
        const numericUnsetRequiredFields = [];

        for (const fieldName of this._numericWidgetFields || []) {
            if (!this.activeFields[fieldName]) {
                continue;
            }
            if (this._isInvisible(fieldName) || this.fields[fieldName]?.relatedPropertyField) {
                continue;
            }

            const value = this.data[fieldName];
            const isEmptyNumericValue =
                value === 0 || value === false || value === null || value === undefined;

            if (this._isRequired(fieldName) && isEmptyNumericValue) {
                numericUnsetRequiredFields.push(fieldName);
            }
        }

        // Silent checks must not create a visual error state. They only report
        // whether the record is valid.
        if (options.silent) {
            return super._checkValidity(options) && !numericUnsetRequiredFields.length;
        }

        // Remove only invalid states previously added by this patch.
        this._numericUnsetRequiredFields ??= new Set();
        for (const fieldName of this._numericUnsetRequiredFields) {
            this._invalidFields.delete(fieldName);
        }
        this._numericUnsetRequiredFields.clear();

        // Add the current missing numeric required fields *before* Odoo's own
        // validity check. Odoo will then include them in the normal invalid
        // field styling and "Invalid fields" notification shown on Save.
        for (const fieldName of numericUnsetRequiredFields) {
            this._numericUnsetRequiredFields.add(fieldName);
            this._setInvalidField(fieldName);
        }

        return super._checkValidity(options);
    },
});
