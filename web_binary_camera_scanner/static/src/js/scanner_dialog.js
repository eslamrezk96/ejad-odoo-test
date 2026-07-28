/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { useBus, useService } from "@web/core/utils/hooks";
import {
    Component,
    onWillStart,
    useState,
} from "@odoo/owl";

const sleep = (milliseconds) =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export class ScannerDialog extends Component {
    static template = "web_binary_camera_scanner.ScannerDialog";
    static components = { Dialog };
    static props = {
        close: Function,
        onScanned: Function,
        requestModel: { type: String, optional: true },
        requestResId: { type: [Number, Boolean], optional: true },
        requestField: { type: String, optional: true },
    };

    setup() {
        this.rpc = useService("rpc");
        // In Odoo 17, bus_service exposes `async: true` while returning an
        // object. Calling useService("bus_service") makes useService try to
        // iterate that boolean as a methods list. Access it directly instead.
        this.busService = this.env.services.bus_service;
        this.user = useService("user");

        this.state = useState({
            phase: "setup",
            jobId: false,
            dpi: 300,
            colorMode: "grayscale",
            source: "auto",
            duplex: false,
            outputFormat: "jpeg",
            result: false,
            filename: false,
            mimetype: false,
            errorCode: false,
            errorMessage: false,
            loadingResult: false,
        });

        onWillStart(async () => {
            await this.busService.addChannel(
                `scanner_job_user_${this.user.userId}`
            );
        });
        useBus(
            this.busService,
            "notification",
            this.onBusNotification
        );
    }

    get isWorking() {
        return ["pending", "claimed", "scanning", "uploading"].includes(
            this.state.phase
        );
    }

    get previewUrl() {
        if (!this.state.result || !this.state.mimetype) {
            return false;
        }
        return `data:${this.state.mimetype};base64,${this.state.result}`;
    }

    onBusNotification(event) {
        const notifications = event.detail || [];
        for (const notification of notifications) {
            if (notification.type !== "scanner_job_status") {
                continue;
            }
            const payload = notification.payload || {};
            if (!this.state.jobId || payload.job_id !== this.state.jobId) {
                continue;
            }

            this.state.phase = payload.state;
            this.state.errorCode = payload.error_code || false;
            this.state.errorMessage = payload.error_message || false;

            if (payload.state === "completed") {
                this.loadResult();
            }
        }
    }

    async startScan() {
        this.state.phase = "pending";
        this.state.errorCode = false;
        this.state.errorMessage = false;
        this.state.result = false;

        try {
            const response = await this.rpc("/scanner/job/create", {
                dpi: Number(this.state.dpi),
                color_mode: this.state.colorMode,
                source: this.state.source,
                duplex: this.state.duplex,
                output_format: this.state.outputFormat,
                request_model: this.props.requestModel || false,
                request_res_id: this.props.requestResId || false,
                request_field: this.props.requestField || false,
            });

            this.state.jobId = response.job_id;
            this.state.phase = response.state;
        } catch (error) {
            this.state.phase = "failed";
            this.state.errorMessage =
                error?.message || _t("The scanner job could not be created.");
        }
    }

    async loadResult() {
        if (this.state.loadingResult || !this.state.jobId) {
            return;
        }
        this.state.loadingResult = true;
        try {
            const response = await this.rpc("/scanner/job/status", {
                job_id: this.state.jobId,
            });
            if (!response.found) {
                throw new Error(_t("The scanner job was not found."));
            }
            this.state.phase = response.state;
            this.state.result = response.result;
            this.state.filename = response.filename;
            this.state.mimetype = response.mimetype;
            this.state.errorCode = response.error_code;
            this.state.errorMessage = response.error_message;
        } catch (error) {
            this.state.phase = "failed";
            this.state.errorMessage =
                error?.message || _t("The scan result could not be loaded.");
        } finally {
            this.state.loadingResult = false;
        }
    }

    async useResult() {
        if (!this.state.result) {
            return;
        }
        await this.props.onScanned({
            data: this.state.result,
            name: this.state.filename || `scan_${Date.now()}.png`,
        });
        this.props.close();
    }

    async cancel() {
        if (this.state.jobId && !["completed", "cancelled"].includes(this.state.phase)) {
            try {
                await this.rpc("/scanner/job/cancel", {
                    job_id: this.state.jobId,
                });
            } catch {
                // Closing the dialog is still allowed if cancellation fails.
            }
        }
        this.props.close();
    }

    reset() {
        this.state.phase = "setup";
        this.state.jobId = false;
        this.state.result = false;
        this.state.filename = false;
        this.state.mimetype = false;
        this.state.errorCode = false;
        this.state.errorMessage = false;
    }
}
