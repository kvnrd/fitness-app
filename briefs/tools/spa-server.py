#!/usr/bin/env python3
"""Serve a web export as a single-page app (unknown paths -> index.html).
Usage: python3 spa-server.py <dist-dir> [port]   (default port 8787, binds 127.0.0.1 only)"""
import http.server, os, sys
root = sys.argv[1] if len(sys.argv) > 1 else 'dist'
port = int(sys.argv[2]) if len(sys.argv) > 2 else 8787
os.chdir(root)
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        fs = self.translate_path(self.path.split('?', 1)[0])
        if not os.path.exists(fs) or os.path.isdir(fs):
            self.path = '/index.html'
        return super().do_GET()
    def log_message(self, fmt, *args):
        pass
print(f'SPA server on http://127.0.0.1:{port} serving {os.getcwd()}', flush=True)
http.server.HTTPServer(('127.0.0.1', port), H).serve_forever()
