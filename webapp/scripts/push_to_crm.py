#!/usr/bin/env python3
"""Push all directory listings into CRM as leads. Uses Supabase direct for full data."""
import json
import time
import requests
import os

SUPABASE_URL = "https://rawlqwjdfzicjepzmcng.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhd2xxd2pkZnppY2plcHptY25nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5NTIwMSwiZXhwIjoyMDc5NzcxMjAxfQ.O2as6N-_5ZcboDVn2AF1rBkGm3yUlaRZ0lfvK3REYIM")
API_CRM = "http://localhost:3000/api/crm/leads"

def get_all_listings():
    """Get full listing data from Supabase directly."""
    url = f"{SUPABASE_URL}/rest/v1/directory_listings?select=*&is_published=eq.true&order=created_at.desc&limit=200"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    res = requests.get(url, headers=headers)
    return res.json()

def main():
    listings = get_all_listings()
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
        desc = (biz.get("description") or "")[:150]

        # Check AI scraped data for email/phone
        ai_data = biz.get("ai_scraped_data") or {}
        if not email:
            email = ai_data.get("email")
        if not phone:
            phone = ai_data.get("phone")

        # Generate email from website domain if still missing
        if not email and website:
            domain = website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
            email = f"info@{domain}"

        if not email:
            skipped += 1
            print(f"[{i+1}] SKIP: {name} (no email or website)")
            continue

        payload = {
            "email": email.lower().strip(),
            "name": name,
            "phone": phone,
            "company": name,
            "source": "gl365_directory",
            "tags": [t for t in [industry, city, state, "directory_import"] if t],
            "notes": f"Industry: {industry} | {city}, {state} | Web: {website} | {desc}",
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
                err = r.json().get("error", "")[:60] if r.text else r.status_code
                print(f"[{i+1}] X {name}: {err}")
        except Exception as e:
            errors += 1
            print(f"[{i+1}] X {name}: {str(e)[:60]}")

        time.sleep(0.3)

    print(f"\nDone! {success} added, {skipped} skipped, {errors} errors out of {len(listings)}")

if __name__ == "__main__":
    main()
