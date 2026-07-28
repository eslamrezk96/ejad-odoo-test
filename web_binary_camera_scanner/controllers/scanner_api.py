import base64
import json
import secrets

from odoo import fields, http
from odoo.http import request


class ScannerGatewayAPI(http.Controller):

    @staticmethod
    def _json_response(payload, status=200):
        return request.make_json_response(payload, status=status)

    @staticmethod
    def _payload():
        raw = request.httprequest.data or b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {}

    @staticmethod
    def _authorized():
        expected = request.env["ir.config_parameter"].sudo().get_param(
            "web_binary_camera_scanner.api_token"
        )
        header = request.httprequest.headers.get("Authorization", "")
        supplied = header[7:].strip() if header.startswith("Bearer ") else ""
        return bool(expected and supplied and secrets.compare_digest(supplied, expected))

    def _require_authorized(self):
        if not self._authorized():
            return self._json_response(
                {"success": False, "error": "UNAUTHORIZED"},
                status=401,
            )
        return None

    @http.route(
        "/scanner/api/jobs/<int:job_id>/claim",
        type="http",
        auth="public",
        csrf=False,
        methods=["POST"],
    )
    def claim_job(self, job_id, **kwargs):
        unauthorized = self._require_authorized()
        if unauthorized:
            return unauthorized
        job = request.env["scanner.job"].sudo().browse(job_id).exists()
        if not job:
            return self._json_response(
                {"success": False, "error": "JOB_NOT_FOUND"},
                status=404,
            )
        if job.state != "pending":
            return self._json_response(
                {"success": False, "error": "JOB_NOT_PENDING", "state": job.state},
                status=409,
            )
        job.set_claimed()
        return self._json_response({
            "success": True,
            "job": job._gateway_payload(),
            "state": job.state,
        })

    @http.route(
        "/scanner/api/jobs/<int:job_id>/status",
        type="http",
        auth="public",
        csrf=False,
        methods=["POST"],
    )
    def update_status(self, job_id, **kwargs):
        unauthorized = self._require_authorized()
        if unauthorized:
            return unauthorized
        payload = self._payload()
        job = request.env["scanner.job"].sudo().browse(job_id).exists()
        if not job:
            return self._json_response(
                {"success": False, "error": "JOB_NOT_FOUND"},
                status=404,
            )

        state = payload.get("state")
        if state == "scanning":
            job.set_scanning()
        elif state == "uploading":
            job.set_uploading()
        elif state == "failed":
            job.set_failed(
                payload.get("error_code") or "SCAN_FAILED",
                payload.get("error_message") or "The scan operation failed.",
            )
        else:
            return self._json_response(
                {"success": False, "error": "INVALID_STATE"},
                status=400,
            )
        return self._json_response({"success": True, "state": job.state})

    @http.route(
        "/scanner/api/jobs/<int:job_id>/result",
        type="http",
        auth="public",
        csrf=False,
        methods=["POST"],
    )
    def upload_result(self, job_id, **kwargs):
        unauthorized = self._require_authorized()
        if unauthorized:
            return unauthorized
        payload = self._payload()
        job = request.env["scanner.job"].sudo().browse(job_id).exists()
        if not job:
            return self._json_response(
                {"success": False, "error": "JOB_NOT_FOUND"},
                status=404,
            )

        file_content = payload.get("file_content")
        filename = payload.get("filename") or f"scan_{job_id}.jpg"
        mimetype = payload.get("mimetype") or "image/jpeg"
        if not file_content:
            return self._json_response(
                {"success": False, "error": "EMPTY_FILE"},
                status=400,
            )

        try:
            decoded = base64.b64decode(file_content, validate=True)
        except (ValueError, TypeError):
            return self._json_response(
                {"success": False, "error": "INVALID_BASE64"},
                status=400,
            )

        max_mb = int(
            request.env["ir.config_parameter"].sudo().get_param(
                "web_binary_camera_scanner.max_upload_mb",
                "15",
            )
        )
        if len(decoded) > max_mb * 1024 * 1024:
            return self._json_response(
                {"success": False, "error": "FILE_TOO_LARGE"},
                status=413,
            )

        job.set_completed(file_content, filename, mimetype)
        return self._json_response({"success": True, "state": job.state})
