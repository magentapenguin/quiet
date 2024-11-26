import http.server

print("Starting server on port 8000")
server = http.server.HTTPServer(('localhost', 8000), http.server.SimpleHTTPRequestHandler)
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("Shutting down server")
    server.shutdown()
