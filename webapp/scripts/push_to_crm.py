#!/usr/bin/env python3
"""Push all directory listings into CRM leads via direct Supabase insert."""
import json
import time
import requests

SUPABASE_URL = "https://rawlqwjdfzicjepzmcng.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhd2xxd2pkZnppY2plcHptY25nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5NTIwMSwiZXhwIjoyMDc5NzcxMjAxfQ.O2as6N-_5ZcboDVn2AF1rBkGm3yUlaRZ0lfvK3REYIM"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

def get_all_listings():
    url = f"{SUPABASE_URL}/rest/v1/directory_listings?select=*&is_published=eq.true&limit=200"
    return requests.get(url, headers=HEADERS).json()

def insert_crm_lead(lead):
    url = f"{SUPABASE_URL}/rest/v1/crm_leads"
    res = requests.post(url, headers=HEADERS, json=lead)
    return res.status_code, res.json() if res.text else {}

def main():
    listings = get_all_listings()
    if not isinstance(listings, list):
        print(f"Error fetching listings: {listings}")
        return
    print(f"Found {len(listings)} directory listings")

    success = 0
    skipped = 0
    errors = 0
    now = "2026-02-06T12:00:00Z"

    for i, biz in enumerate(listings):
        name = biz.get("business_name", "")
        email = biz.get("email")
        phone = biz.get("phone")
        website = biz.get("website", "") or ""
        industry = biz.get("industry", "")
        city = biz.get("city", "") or ""
        state = biz.get("state", "") or ""
        desc = (biz.get("description") or "")[:150]

        # Check AI scraped data for email/phone
        ai_data = biz.get("ai_scraped_data")
        if isinstance(ai_data, dict):
            if not email: email = ai_data.get("email")
            if not phone: phone = ai_data.get("phone")
            if not website: website = ai_data.get("website") or ""

        # Generate email from website domain
        if not email and website:
            domain = website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
            if domain and "." in domain:
                email = f"info@{domain}"

        if not email:
            skipped += 1
            print(f"[{i+1}] SKIP: {name}")
            continue

        lead = {
            "email": email.lower().strip(),
            "user_id": "677b536d-6521-4ac8-a0a5-98278b35f4cc",
            "name": name,
            "phone": phone,
            "company": name,
            "source": "gl365_directory",
            "status": "new",
            "tags": [t for t in [industry, city, state, "directory_import"] if t],
            "notes": f"Industry: {industry} | {city}, {state} | Web: {website} | {desc}",
            "first_contact_at": now,
            "created_at": now,
            "updated_at": now,
        }

        code, data = insert_crm_lead(lead)
        if code in [200, 201]:
            success += 1
            print(f"[{i+1}] + {name} ({email})")
        elif code == 409 or "duplicate" in str(data).lower() or "already exists" in str(data).lower():
            skipped += 1
            print(f"[{i+1}] ~ EXISTS: {name}")
        else:
            errors += 1
            print(f"[{i+1}] X {name}: {str(data)[:80]}")

        time.sleep(0.2)

    print(f"\nDone! {success} added, {skipped} skipped, {errors} errors out of {len(listings)}")

if __name__ == "__main__":
    main()
