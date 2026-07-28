import uuid

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class ScannerJob(models.Model):
    _name = "scanner.job"
    _description = "Scanner Job"
    _order = "id desc"

    name = fields.Char(
        string="Reference",
        required=True,
        readonly=True,
        copy=False,
        default=lambda self: _("New"),
    )
    state = fields.Selection(
        selection=[
            ("pending", "Pending"),
            ("claimed", "Claimed"),
            ("scanning", "Scanning"),
            ("uploading", "Uploading"),
            ("completed", "Completed"),
            ("failed", "Failed"),
            ("cancelled", "Cancelled"),
        ],
        required=True,
        default="pending",
        index=True,
        readonly=True,
    )
    user_id = fields.Many2one(
        "res.users",
        string="Requested By",
        required=True,
        default=lambda self: self.env.user,
        readonly=True,
        index=True,
    )
    request_uid = fields.Char(
        string="Request UID",
        required=True,
        readonly=True,
        copy=False,
        default=lambda self: str(uuid.uuid4()),
        index=True,
    )

    request_model = fields.Char(readonly=True)
    request_res_id = fields.Integer(readonly=True)
    request_field = fields.Char(readonly=True)

    dpi = fields.Integer(required=True, default=300, readonly=True)
    color_mode = fields.Selection(
        [
            ("color", "Color"),
            ("grayscale", "Grayscale"),
            ("bw", "Black & White"),
        ],
        required=True,
        default="grayscale",
        readonly=True,
    )
    source = fields.Selection(
        [
            ("auto", "Automatic"),
            ("flatbed", "Flatbed"),
            ("feeder", "Feeder"),
        ],
        required=True,
        default="auto",
        readonly=True,
    )
    duplex = fields.Boolean(readonly=True)
    output_format = fields.Selection(
        [("jpeg", "JPEG"), ("png", "PNG"), ("pdf", "PDF")],
        required=True,
        default="jpeg",
        readonly=True,
    )

    result = fields.Binary(attachment=True, readonly=True)
    result_filename = fields.Char(readonly=True)
    result_mimetype = fields.Char(readonly=True)

    error_code = fields.Char(readonly=True)
    error_message = fields.Text(readonly=True)

    claimed_at = fields.Datetime(readonly=True)
    started_at = fields.Datetime(readonly=True)
    completed_at = fields.Datetime(readonly=True)

    _sql_constraints = [
        ("request_uid_unique", "unique(request_uid)", "The scanner request UID must be unique."),
    ]

    @api.model_create_multi
    def create(self, vals_list):
        sequence = self.env["ir.sequence"]
        for vals in vals_list:
            if vals.get("name", _("New")) == _("New"):
                vals["name"] = sequence.next_by_code("scanner.job") or _("New")
        jobs = super().create(vals_list)
        for job in jobs:
            job._notify_gateway()
            job._notify_requester()
        return jobs

    def _gateway_payload(self):
        self.ensure_one()
        return {
            "job_id": self.id,
            "request_uid": self.request_uid,
            "dpi": self.dpi,
            "color_mode": self.color_mode,
            "source": self.source,
            "duplex": self.duplex,
            "output_format": self.output_format,
        }

    def _status_payload(self):
        self.ensure_one()
        return {
            "job_id": self.id,
            "request_uid": self.request_uid,
            "state": self.state,
            "error_code": self.error_code or False,
            "error_message": self.error_message or False,
            "result_filename": self.result_filename or False,
            "result_mimetype": self.result_mimetype or False,
        }

    def _notify_gateway(self):
        for job in self:
            self.env["bus.bus"]._sendone(
                "scanner_gateway",
                "scanner_job_created",
                job._gateway_payload(),
            )

    def _notify_requester(self):
        for job in self:
            channel = f"scanner_job_user_{job.user_id.id}"
            self.env["bus.bus"]._sendone(
                channel,
                "scanner_job_status",
                job._status_payload(),
            )

    def set_claimed(self):
        for job in self:
            if job.state != "pending":
                raise UserError(_("Only pending scanner jobs can be claimed."))
            job.write({
                "state": "claimed",
                "claimed_at": fields.Datetime.now(),
                "error_code": False,
                "error_message": False,
            })
            job._notify_requester()
        return True

    def set_scanning(self):
        for job in self:
            if job.state not in ("pending", "claimed"):
                raise UserError(_("This scanner job cannot be moved to scanning."))
            job.write({
                "state": "scanning",
                "started_at": job.started_at or fields.Datetime.now(),
                "error_code": False,
                "error_message": False,
            })
            job._notify_requester()
        return True

    def set_uploading(self):
        for job in self:
            if job.state not in ("claimed", "scanning"):
                raise UserError(_("This scanner job cannot be moved to uploading."))
            job.write({"state": "uploading"})
            job._notify_requester()
        return True

    def set_failed(self, error_code, error_message):
        for job in self:
            if job.state in ("completed", "cancelled"):
                raise UserError(_("A completed or cancelled scanner job cannot fail."))
            job.write({
                "state": "failed",
                "error_code": error_code or "SCAN_FAILED",
                "error_message": error_message or _("The scan operation failed."),
                "completed_at": fields.Datetime.now(),
            })
            job._notify_requester()
        return True

    def set_completed(self, file_content, filename, mimetype):
        if isinstance(file_content, str):
            file_content = file_content.encode("ascii")
        for job in self:
            if job.state in ("completed", "cancelled"):
                raise UserError(_("This scanner job can no longer receive a result."))
            job.write({
                "state": "completed",
                "result": file_content,
                "result_filename": filename,
                "result_mimetype": mimetype,
                "completed_at": fields.Datetime.now(),
                "error_code": False,
                "error_message": False,
            })
            job._notify_requester()
        return True

    def action_cancel(self):
        for job in self:
            if job.state == "completed":
                raise UserError(_("A completed scanner job cannot be cancelled."))
            if job.state != "cancelled":
                job.write({
                    "state": "cancelled",
                    "completed_at": fields.Datetime.now(),
                })
                job._notify_requester()
        return True

    def action_retry(self):
        for job in self:
            if job.state not in ("failed", "cancelled"):
                raise UserError(_("Only failed or cancelled scanner jobs can be retried."))
            job.write({
                "state": "pending",
                "claimed_at": False,
                "started_at": False,
                "completed_at": False,
                "result": False,
                "result_filename": False,
                "result_mimetype": False,
                "error_code": False,
                "error_message": False,
            })
            job._notify_gateway()
            job._notify_requester()
        return True
