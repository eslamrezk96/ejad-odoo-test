/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import {
    BinaryField,
    binaryField,
} from "@web/views/fields/binary/binary_field";
import {
    onWillUnmount,
    useRef,
    useState,
} from "@odoo/owl";

export class CameraBinaryField extends BinaryField {
    static template = "camera_binary_widget.CameraBinaryField";

    setup() {
        super.setup();

        this.cameraState = useState({
            open: false,
            busy: false,
            preview: false,
            previewSrc: "",
            facingMode: "environment",
        });

        this.videoRef = useRef("cameraVideo");
        this.cameraStream = null;
        this.pendingImageData = null;
        this.pendingFileName = null;

        onWillUnmount(() => {
            this.stopCamera();
            this.clearPendingImage();
        });
    }

    async openCamera() {
        if (this.cameraState.busy) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            this.notification.add(
                _t("Camera access is not supported by this browser."),
                { type: "danger" }
            );
            return;
        }

        this.clearPendingImage();
        this.cameraState.open = true;
        this.cameraState.preview = false;

        await this.startCamera();
    }

    async startCamera() {
        if (this.cameraState.busy) {
            return;
        }

        this.cameraState.busy = true;

        try {
            this.stopCamera();

            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: this.cameraState.facingMode },
                },
                audio: false,
            });

            this.cameraState.open = true;
            this.cameraState.preview = false;

            const video = this.videoRef.el;
            if (!video) {
                throw new Error("Camera video element is not available.");
            }

            video.srcObject = this.cameraStream;
            await video.play();
        } catch (error) {
            console.error("CameraBinaryField: unable to open camera", error);
            this.stopCamera();
            this.cameraState.open = false;

            let message = _t("Unable to access the camera.");
            if (!window.isSecureContext) {
                message = _t("Camera access requires HTTPS (or localhost during development).");
            } else if (error?.name === "NotAllowedError") {
                message = _t("Camera permission was denied. Allow camera access in the browser and try again.");
            } else if (error?.name === "NotFoundError") {
                message = _t("No camera was found on this device.");
            } else if (error?.name === "NotReadableError") {
                message = _t("The camera is already in use by another application or browser tab.");
            }

            this.notification.add(message, { type: "danger" });
        } finally {
            this.cameraState.busy = false;
        }
    }

    async switchCamera() {
        if (this.cameraState.busy || this.cameraState.preview) {
            return;
        }

        this.cameraState.facingMode =
            this.cameraState.facingMode === "environment"
                ? "user"
                : "environment";

        await this.startCamera();
    }

    captureImage() {
        const video = this.videoRef.el;

        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            this.notification.add(
                _t("The camera is not ready yet."),
                { type: "warning" }
            );
            return;
        }

        if (!video.videoWidth || !video.videoHeight) {
            this.notification.add(
                _t("Could not read an image from the camera."),
                { type: "warning" }
            );
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) {
            this.notification.add(
                _t("Could not prepare the captured image."),
                { type: "danger" }
            );
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const separatorIndex = dataUrl.indexOf(",");
        const base64Data = separatorIndex >= 0
            ? dataUrl.slice(separatorIndex + 1)
            : dataUrl;

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

        this.pendingImageData = base64Data;
        this.pendingFileName = `camera_${timestamp}.jpg`;
        this.cameraState.previewSrc = dataUrl;
        this.cameraState.preview = true;

        // The camera is no longer needed while the user reviews the photo.
        this.stopCamera();
    }

    async usePhoto() {
        if (!this.pendingImageData || !this.pendingFileName) {
            this.notification.add(
                _t("There is no captured photo to save."),
                { type: "warning" }
            );
            return;
        }

        if (this.cameraState.busy) {
            return;
        }

        this.cameraState.busy = true;

        try {
            await this.update({
                data: this.pendingImageData,
                name: this.pendingFileName,
            });
            this.closeCamera();
        } catch (error) {
            console.error("CameraBinaryField: unable to save captured image", error);
            this.notification.add(
                _t("The captured image could not be saved."),
                { type: "danger" }
            );
        } finally {
            this.cameraState.busy = false;
        }
    }

    async retakePhoto() {
        if (this.cameraState.busy) {
            return;
        }

        this.clearPendingImage();
        this.cameraState.preview = false;
        await this.startCamera();
    }

    closeCamera() {
        this.stopCamera();
        this.clearPendingImage();
        this.cameraState.open = false;
        this.cameraState.preview = false;
    }

    clearPendingImage() {
        this.pendingImageData = null;
        this.pendingFileName = null;
        this.cameraState.previewSrc = "";
    }

    stopCamera() {
        if (this.cameraStream) {
            for (const track of this.cameraStream.getTracks()) {
                track.stop();
            }
            this.cameraStream = null;
        }

        const video = this.videoRef?.el;
        if (video?.srcObject) {
            video.srcObject = null;
        }
    }
}

export const cameraBinaryField = {
    ...binaryField,
    component: CameraBinaryField,
    displayName: _t("File with Camera"),
};

registry.category("fields").add("camera_binary", cameraBinaryField);
