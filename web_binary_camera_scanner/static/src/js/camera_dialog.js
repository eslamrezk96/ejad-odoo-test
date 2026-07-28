/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import {
    Component,
    onMounted,
    onWillUnmount,
    useRef,
    useState,
} from "@odoo/owl";

export class CameraDialog extends Component {
    static template = "web_binary_camera_scanner.CameraDialog";
    static components = { Dialog };
    static props = {
        close: Function,
        onCaptured: Function,
    };

    setup() {
        this.videoRef = useRef("video");
        this.canvasRef = useRef("canvas");
        this.state = useState({
            phase: "camera",
            loading: true,
            error: false,
            previewUrl: false,
            capturedData: false,
            facingMode: "environment",
            switching: false,
        });
        this.stream = null;

        onMounted(() => this.startCamera());
        onWillUnmount(() => this.stopCamera());
    }

    get isPreview() {
        return this.state.phase === "preview";
    }

    async startCamera() {
        this.stopCamera();
        this.state.phase = "camera";
        this.state.loading = true;
        this.state.error = false;
        this.state.previewUrl = false;
        this.state.capturedData = false;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    _t("Camera access is not supported by this browser.")
                );
            }

            const constraints = {
                audio: false,
                video: {
                    facingMode: { ideal: this.state.facingMode },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = this.videoRef.el;
            if (!video) {
                throw new Error(_t("The camera preview is not available."));
            }
            video.srcObject = this.stream;
            await video.play();
        } catch (error) {
            this.state.error =
                error?.message || _t("The camera could not be started.");
        } finally {
            this.state.loading = false;
            this.state.switching = false;
        }
    }

    stopCamera() {
        if (this.stream) {
            for (const track of this.stream.getTracks()) {
                track.stop();
            }
            this.stream = null;
        }
        if (this.videoRef.el) {
            this.videoRef.el.srcObject = null;
        }
    }

    async switchCamera() {
        if (this.state.loading || this.state.switching || this.isPreview) {
            return;
        }
        this.state.switching = true;
        this.state.facingMode =
            this.state.facingMode === "environment" ? "user" : "environment";
        await this.startCamera();
    }

    capture() {
        const video = this.videoRef.el;
        const canvas = this.canvasRef.el;
        if (!video?.videoWidth || !video?.videoHeight || !canvas) {
            this.state.error = _t("The camera is not ready yet.");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");

        // Mirror front-camera captures so the saved image matches the preview.
        if (this.state.facingMode === "user") {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        this.state.capturedData = dataUrl.split(",")[1];
        this.state.previewUrl = dataUrl;
        this.state.phase = "preview";
        this.state.error = false;
        this.stopCamera();
    }

    async retake() {
        await this.startCamera();
    }

    async usePhoto() {
        if (!this.state.capturedData) {
            this.state.error = _t("No captured photo is available.");
            return;
        }

        await this.props.onCaptured({
            data: this.state.capturedData,
            name: `camera_${Date.now()}.jpg`,
        });
        this.props.close();
    }
}
