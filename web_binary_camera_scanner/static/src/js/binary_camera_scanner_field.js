/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import {
    BinaryField,
    binaryField,
    listBinaryField,
} from "@web/views/fields/binary/binary_field";
import { CameraDialog } from "./camera_dialog";
import { ScannerDialog } from "./scanner_dialog";

export class BinaryCameraScannerField extends BinaryField {
    static template = "web_binary_camera_scanner.BinaryCameraScannerField";
    static components = {
        ...BinaryField.components,
    };

    setup() {
        super.setup();
        this.dialog = useService("dialog");
    }

    openCamera() {
        this.dialog.add(CameraDialog, {
            onCaptured: async ({ data, name }) => {
                await this.update({ data, name });
            },
        });
    }

    openScanner() {
        this.dialog.add(ScannerDialog, {
            requestModel: this.props.record.resModel,
            requestResId: this.props.record.resId || false,
            requestField: this.props.name,
            onScanned: async ({ data, name }) => {
                await this.update({ data, name });
            },
        });
    }
}

/**
 * Use the same enhanced interface in list views. Keeping a separate class
 * allows list-specific behavior to be introduced later without changing the
 * global form-field implementation.
 */
export class ListBinaryCameraScannerField extends BinaryCameraScannerField {}

export const binaryCameraScannerField = {
    ...binaryField,
    component: BinaryCameraScannerField,
};

export const listBinaryCameraScannerField = {
    ...listBinaryField,
    component: ListBinaryCameraScannerField,
};

const fieldsRegistry = registry.category("fields");

// Keep the explicit widget name for backward compatibility.
fieldsRegistry.add("binary_camera_scanner", binaryCameraScannerField);
fieldsRegistry.add(
    "list.binary_camera_scanner",
    listBinaryCameraScannerField
);

// Replace Odoo's default Binary widget globally. A field that explicitly uses
// another widget, such as widget="image", is not affected by this override.
fieldsRegistry.add("binary", binaryCameraScannerField, { force: true });
fieldsRegistry.add("list.binary", listBinaryCameraScannerField, { force: true });
