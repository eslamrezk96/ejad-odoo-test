/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import {
    BinaryField,
    binaryField,
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

export const binaryCameraScannerField = {
    ...binaryField,
    component: BinaryCameraScannerField,
};

registry
    .category("fields")
    .add("binary_camera_scanner", binaryCameraScannerField);
