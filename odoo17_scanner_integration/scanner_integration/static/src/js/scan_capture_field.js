/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { Component, useState } from "@odoo/owl";

// Change this if your helper app runs on a different port, or read it
// from ir.config_parameter via an ORM call in setup() if you want it
// configurable per deployment.
const HELPER_URL = "http://127.0.0.1:5678/scan";

export class ScanCaptureField extends Component {
    static template = "scanner_integration.ScanCaptureField";
    static props = { ...standardFieldProps };

    setup() {
        this.notification = useService("notification");
        this.state = useState({ scanning: false });
    }

    async onScanClick() {
        this.state.scanning = true;
        try {
            const response = await fetch(HELPER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: "Default" }),
            });
            if (!response.ok) {
                let message = "Scan failed";
                try {
                    const body = await response.json();
                    message = body.error || message;
                } catch {
                    // ignore, keep default message
                }
                throw new Error(message);
            }
            const blob = await response.blob();
            const base64 = await this.blobToBase64(blob);
            await this.props.record.update({
                scan_data: base64,
                scan_filename: `scan_${Date.now()}.pdf`,
            });
            this.notification.add("Document scanned successfully.", {
                type: "success",
            });
        } catch (error) {
            this.notification.add(
                `Could not reach the scanner helper. Is it running on this PC? (${error.message})`,
                { type: "danger", sticky: true }
            );
        } finally {
            this.state.scanning = false;
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

registry.category("fields").add("scan_capture", {
    component: ScanCaptureField,
});
