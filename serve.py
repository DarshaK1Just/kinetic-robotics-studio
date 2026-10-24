#!/usr/bin/env python3
"""Run Kinetic on a loopback web origin. Python standard library only."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse, socket, threading, webbrowser

ROOT = Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def main():
    parser=argparse.ArgumentParser(description='Open the Kinetic learning website locally.')
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('Use a port from 1024 to 65535.')
    if not (ROOT/'index.html').exists():
        parser.error('index.html is missing. Run python build.py first.')
    try:
        server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=str(ROOT)))
    except OSError as exc:
        parser.error(f'Cannot use port {args.port}: {exc}. Try --port 8766.')
    url=f'http://127.0.0.1:{args.port}/'
    print(f'Kinetic Robotics Studio: {url}\nThis serves your own computer only. Press Ctrl+C to stop.')
    print('External reference photos, YouTube and the optional Python runtime still need internet.')
    if not args.no_browser:
        threading.Timer(.5,lambda:webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
if __name__=='__main__':
    main()
