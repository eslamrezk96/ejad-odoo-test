"""
Local scanner helper for the Odoo "Scanner Integration" module.

Runs on the Windows PC that has a scanner attached. Exposes a small local
HTTP API that the Odoo web UI calls to trigger a scan and receive the
resulting PDF. Uses NAPS2 (free, open source: https://www.naps2.com) to
drive the TWAIN/WIA scanner driver, since browsers cannot talk to those
drivers directly.

Setup:
  1. Install NAPS2 from https://www.naps2.com
  2. Open NAPS2, configure your scanner, and save a scan profile
     (File > ... or the "+" button) named "Default" (or any name you like -
     just pass that name as "profile" from the Odoo widget / request body).
  3. Adjust NAPS2_CONSOLE below to match your install path.
  4. pip install flask
  5. python app.py
     (or package with pyinstaller and run as a startup app / Windows
     service using NSSM, so it's always running when the user logs in)

The server only listens on 127.0.0.1, so it is not reachable from the
network - only from a browser on the same machine.
"""

import os
import subprocess
import tempfile
import uuid

from flask import Flask, jsonify, request, send_file

app = Flask(__name__)

# Adjust to your NAPS2 install path.
NAPS2_CONSOLE = r"C:\Program Files\NAPS2\NAPS2.Console.exe"

SCAN_DIR = tempfile.gettempdir()
SCAN_TIMEOUT_SECONDS = 120


@app.after_request
def add_cors_headers(response):
    # Local-only server, so a permissive CORS policy is fine here.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/scan", methods=["POST", "OPTIONS"])
def scan():
    if request.method == "OPTIONS":
        return "", 204

    if not os.path.exists(NAPS2_CONSOLE):
        return jsonify({
            "error": "NAPS2.Console.exe not found. Check NAPS2_CONSOLE "
                     "path in app.py."
        }), 500

    payload = request.get_json(silent=True) or {}
    profile = payload.get("profile", "Default")

    filename = f"scan_{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(SCAN_DIR, filename)

    try:
        result = subprocess.run(
            [NAPS2_CONSOLE, "-o", filepath, "-p", profile],
            capture_output=True,
            text=True,
            timeout=SCAN_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Scan timed out."}), 504

    if result.returncode != 0 or not os.path.exists(filepath):
        error_detail = (result.stderr or result.stdout or "Unknown error").strip()
        return jsonify({"error": f"Scan failed: {error_detail}"}), 500

    try:
        return send_file(
            filepath,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="scan.pdf",
        )
    finally:
        # Best-effort cleanup; ignore if the file is briefly locked.
        try:
            os.remove(filepath)
        except OSError:
            pass


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5678)
