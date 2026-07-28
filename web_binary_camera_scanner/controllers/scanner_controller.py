from odoo import http
from odoo.http import request


class ScannerJobController(http.Controller):

    @staticmethod
    def _get_job(job_id):
        job = request.env["scanner.job"].search([
            ("id", "=", int(job_id)),
            ("user_id", "=", request.env.user.id),
        ], limit=1)
        if not job and request.env.user.has_group(
            "web_binary_camera_scanner.group_scanner_manager"
        ):
            job = request.env["scanner.job"].search(
                [("id", "=", int(job_id))],
                limit=1,
            )
        return job

    @http.route("/scanner/job/create", type="json", auth="user", methods=["POST"])
    def create_job(
        self,
        dpi=300,
        color_mode="grayscale",
        source="auto",
        duplex=False,
        output_format="jpeg",
        request_model=False,
        request_res_id=False,
        request_field=False,
    ):
        allowed_dpi = {150, 200, 300, 600}
        allowed_colors = {"color", "grayscale", "bw"}
        allowed_sources = {"auto", "flatbed", "feeder"}
        allowed_formats = {"jpeg", "png", "pdf"}

        dpi = int(dpi)
        if dpi not in allowed_dpi:
            dpi = 300
        if color_mode not in allowed_colors:
            color_mode = "grayscale"
        if source not in allowed_sources:
            source = "auto"
        if output_format not in allowed_formats:
            output_format = "jpeg"

        job = request.env["scanner.job"].create({
            "dpi": dpi,
            "color_mode": color_mode,
            "source": source,
            "duplex": bool(duplex),
            "output_format": output_format,
            "request_model": request_model or False,
            "request_res_id": int(request_res_id or 0),
            "request_field": request_field or False,
        })
        return {
            "job_id": job.id,
            "request_uid": job.request_uid,
            "state": job.state,
        }

    @http.route("/scanner/job/status", type="json", auth="user", methods=["POST"])
    def job_status(self, job_id):
        job = self._get_job(job_id)
        if not job:
            return {"found": False}

        result = job.result
        if isinstance(result, bytes):
            result = result.decode()

        return {
            "found": True,
            "job_id": job.id,
            "state": job.state,
            "result": result or False,
            "filename": job.result_filename or False,
            "mimetype": job.result_mimetype or False,
            "error_code": job.error_code or False,
            "error_message": job.error_message or False,
        }

    @http.route("/scanner/job/cancel", type="json", auth="user", methods=["POST"])
    def cancel_job(self, job_id):
        job = self._get_job(job_id)
        if not job:
            return {"success": False, "message": "Scanner job not found."}
        job.action_cancel()
        return {"success": True, "state": job.state}
