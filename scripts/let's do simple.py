import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
BASE_URL = "https://solve.ivy.homes"

# 1. Login to get a fresh token
login_payload = {
    "email": "demo1@ivy.homes",
    "password": "8a0f67508a"
}
login_headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", headers=login_headers, json=login_payload).json()

# Grab the actual access_token (since you found the docs lied about it being called "token")
access_token = login_resp.get("access_token")

# 2. Fetch the listings using BOTH headers
data_headers = {
    "X-API-Key": API_KEY,
    "Authorization": f"Bearer {access_token}"
}

print("Fetching first page of listings...")
listings_resp = requests.get(f"{BASE_URL}/v1/listings", headers=data_headers)

if listings_resp.status_code == 200:
    print("[✓] Success! Here is a preview of the data:")
    # Print just the top-level keys and the first listing to verify
    data = listings_resp.json()
    print(f"Total listings: {data.get('total')}")
    print(json.dumps(data.get("results", [])[0], indent=2))
else:
    print(f"[✗] Failed: {listings_resp.text}")