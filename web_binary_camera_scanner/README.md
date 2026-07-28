# Binary Camera & Scanner — Odoo 17

The add-on provides:

- Upload
- Browser Camera
- Scanner button
- `scanner.job`
- Odoo Bus/WebSocket status notifications
- Gateway HTTP endpoints
- Gateway Test screen

No `scanner.gateway` or `scanner.device` models are created.
Virtual Scanner Mode has been removed.

## Test screen

Open:

`Scanner → Gateway Test`

Starting a scan creates a real `scanner.job` and waits for the external
Scanner Gateway.

## Gateway notification

When a `scanner.job` is created, Odoo sends:

- Channel: `scanner_gateway`
- Notification type: `scanner_job_created`

## Gateway endpoints

Use:

`Authorization: Bearer <Gateway API Token>`

- `POST /scanner/api/jobs/{job_id}/claim`
- `POST /scanner/api/jobs/{job_id}/status`
- `POST /scanner/api/jobs/{job_id}/result`
