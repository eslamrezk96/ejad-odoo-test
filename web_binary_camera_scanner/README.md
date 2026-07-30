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

## Global Binary field behavior

Starting from version `17.0.1.3.0`, the add-on replaces Odoo's default
`binary` field widget globally. Therefore, a normal field declaration is
enough:

```xml
<field name="document" filename="document_filename"/>
```

It automatically displays Upload, Camera, and Scanner actions. It is no
longer necessary to add:

```xml
widget="binary_camera_scanner"
```

The old explicit widget name remains registered for backward compatibility.
Fields that explicitly use another widget, such as `widget="image"`, are not
affected. The global behavior also applies to the default binary widget in
list views.

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
