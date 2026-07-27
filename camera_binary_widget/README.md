# Camera Binary Widget - Odoo 17

Adds camera capture support to Odoo `fields.Binary` while preserving the standard upload/download/clear behavior.

## Features

- Keep the standard Odoo file upload/download/clear behavior.
- Open the device camera from a Binary field.
- Prefer the rear camera by default on supported mobile devices.
- Switch between rear/front camera.
- Capture a JPEG photo.
- Preview the captured photo before saving.
- Retake the photo without touching the Binary field.
- Save only after pressing **Use Photo**.
- Stop the camera stream on capture, cancel, or view destruction.
- Responsive camera preview/actions for mobile devices.

## Installation

1. Copy `camera_binary_widget` to your custom addons path.
2. Restart Odoo.
3. Update the Apps list.
4. Install or upgrade **Camera Binary Widget**.

## Usage

Given a model field:

```python
document = fields.Binary(string="Document", attachment=True)
document_filename = fields.Char(string="Document Filename")
```

Use the widget in a form view:

```xml
<field name="document"
       filename="document_filename"
       widget="camera_binary"/>
```

The Camera flow is:

`Open Camera -> Capture -> Preview -> Retake / Use Photo`

`Use Photo` writes the JPEG Base64 data and generated filename to the same Binary field using Odoo's normal BinaryField update flow.

## Browser requirement

Camera APIs normally require HTTPS. `localhost` is allowed by browsers for local development.
