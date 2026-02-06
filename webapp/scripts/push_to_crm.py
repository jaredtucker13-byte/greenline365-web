#!/usr/bin/env python3
"""Push all directory listings into CRM as leads for email campaigns."""
import json
import time
import requests

API_DIR = "http://localhost:3000/api/directory?limit=200"
API_CRM = "http://localhost:3000/api/crm/leads"

def main():
    # Fetch all directory listings
    res = requests.get(API_DIR)
    listings = res.json()
    print(f"Found {len(listings)} directory listings")

    success = 0
    skipped = 0
    errors = 0

    for i, biz in enumerate(listings):
        name = biz.get("business_name", "")
        email = biz.get("email")
        phone = biz.get("phone")
        website = biz.get("website", "")
        industry = biz.get("industry", "")
        city = biz.get("city", "")
        state = biz.get("state", "")
        desc = biz.get("description", "")

        # Generate email from website if missing
        if not email and website:
            domain = website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
            email = f"info@{domain}"

        if not email:
            skipped += 1
            print(f"[{i+1}] SKIP (no email): {name}")
            continue

        payload = {
            "email": email,
            "name": name,
            "phone": phone,
            "company": name,
            "source": "gl365_directory",
            "tags": [industry, city, state, "directory_import"],
            "notes": f"Industry: {industry} | {city}, {state} | Website: {website} | {desc[:100] if desc else ''}",
            "status": "new",
        }

        try:
            r = requests.post(API_CRM, json=payload, timeout=10)
            if r.status_code == 201:
                success += 1
                print(f"[{i+1}] + {name} ({email})")
            elif r.status_code == 409:
                skipped += 1
                print(f"[{i+1}] ~ EXISTS: {name}")
            else:
                errors += 1
                print(f"[{i+1}] X {name}: {r.json().get('error','')[:60]}")
        except Exception as e:
            errors += 1
            print(f"[{i+1}] X {name}: {str(e)[:60]}")

        time.sleep(0.3)

    print(f"\nDone! {success} added, {skipped} skipped, {errors} errors")

if __name__ == "__main__":
    main()
