import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}


class MiniAppHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print("HTTP:", format % args)

    def do_GET(self):
        requested_path = urlparse(self.path).path

        if requested_path == "/":
            requested_path = "/index.html"

        relative_path = requested_path.lstrip("/")
        file_path = (PUBLIC_DIR / relative_path).resolve()
        public_root = PUBLIC_DIR.resolve()

        # Защита от выхода за пределы папки public
        try:
            file_path.relative_to(public_root)
        except ValueError:
            self.send_error(403, "Forbidden")
            return

        if not file_path.is_file():
            self.send_error(404, "File not found")
            print("404:", requested_path)
            return

        try:
            content = file_path.read_bytes()

            content_type = MIME_TYPES.get(
                file_path.suffix.lower(),
                "application/octet-stream"
            )

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()

            self.wfile.write(content)

            print("200:", requested_path)

        except Exception as error:
            print("ERROR:", repr(error))
            self.send_error(500, "Internal server error")


def main():
    port = int(os.environ.get("PORT", "8000"))

    if not PUBLIC_DIR.exists():
        print("ERROR: папка public не найдена:")
        print(PUBLIC_DIR)
        raise SystemExit(1)

    index_file = PUBLIC_DIR / "index.html"

    if not index_file.exists():
        print("ERROR: public/index.html не найден")
        raise SystemExit(1)

    server = ThreadingHTTPServer(
        ("0.0.0.0", port),
        MiniAppHandler
    )

    print("=" * 60)
    print("VK MINI APP SERVER")
    print("=" * 60)
    print("Server started")
    print("Host: 0.0.0.0")
    print("Port:", port)
    print("Public:", PUBLIC_DIR)
    print("=" * 60)

    server.serve_forever()


if __name__ == "__main__":
    main()
