#!/usr/bin/env python
"""Verify all critical routes are registered"""
from backend.app.main import app

print('\n=== Route Registration Status ===\n')
endpoints = [
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/candidates/me',
    '/api/v1/jobs',
    '/api/v1/uploads/resume',
    '/api/v1/generative/chat'
]

routes_found = {}
for route in app.routes:
    path = str(route.path)
    for ep in endpoints:
        if ep in path:
            routes_found[ep] = path

print('Critical Endpoints:')
for ep in endpoints:
    status = 'OK' if ep in routes_found else 'MISSING'
    print(f'  [{status}] {ep}')

print('\n=== CORS Configuration ===\n')
print('Allowed Origins (explicit):')
for m in app.user_middleware:
    if hasattr(m, 'options') and 'allow_origins' in m.options:
        for origin in m.options.get('allow_origins', []):
            print(f'  - {origin}')
    if hasattr(m, 'options') and 'allow_origin_regex' in m.options:
        print(f'  Regex: {m.options.get("allow_origin_regex")}')

print('\n=== Test CORS Preflight ===\n')
from fastapi.testclient import TestClient
client = TestClient(app)

test_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173'
]

for origin in test_origins:
    resp = client.options(
        '/api/v1/candidates/me',
        headers={
            'Origin': origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization,content-type'
        }
    )
    allowed = resp.headers.get('access-control-allow-origin', 'NOT_ALLOWED')
    status = 'PASS' if allowed else 'FAIL'
    print(f'  [{status}] Origin: {origin} -> {allowed}')

print('\nApp verification complete!\n')

