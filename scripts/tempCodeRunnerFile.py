headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

payload = {
    "email": "demo1@ivy.homes",
    "password": "8a0f67508a"
}

resp = requests.post(f"{BASE_URL}/auth/login", headers=headers, json=payload, timeout=15)

print(f"Status Code: {resp.status_code}")
try:
    auth_data = resp.json()
    print(json.dumps(auth_data, indent=2))
except Exception:
    print(resp.text)