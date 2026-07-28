import base64

from odoo.tests.common import TransactionCase


class TestScannerJob(TransactionCase):

    def test_scanner_job_lifecycle(self):
        job = self.env["scanner.job"].create({
            "dpi": 300,
            "color_mode": "grayscale",
            "source": "auto",
            "output_format": "jpeg",
        })
        self.assertEqual(job.state, "pending")

        job.set_claimed()
        self.assertEqual(job.state, "claimed")

        job.set_scanning()
        self.assertEqual(job.state, "scanning")

        job.set_uploading()
        self.assertEqual(job.state, "uploading")

        content = base64.b64encode(b"fake scanner result")
        job.set_completed(content, "scan.jpg", "image/jpeg")

        self.assertEqual(job.state, "completed")
        self.assertTrue(job.result)
        self.assertEqual(job.result_mimetype, "image/jpeg")
