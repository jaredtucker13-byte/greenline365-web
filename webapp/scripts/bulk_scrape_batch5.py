#!/usr/bin/env python3
"""GL365 Batch 5: Ybor & Downtown Hub (50 URLs) — with duplicate detection"""
import json, time, requests

API_BASE = "http://localhost:3000/api/directory/scrape"
SUPABASE_URL = "https://rawlqwjdfzicjepzmcng.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhd2xxd2pkZnppY2plcHptY25nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5NTIwMSwiZXhwIjoyMDc5NzcxMjAxfQ.O2as6N-_5ZcboDVn2AF1rBkGm3yUlaRZ0lfvK3REYIM"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}
USER_ID = "677b536d-6521-4ac8-a0a5-98278b35f4cc"

BATCH = [
    {"name": "Davidoff of Geneva", "industry": "restaurant", "url": "davidoffgeneva.com"},
    {"name": "Grand Cathedral Cigars", "industry": "restaurant", "url": "grandcathedralcigars.com"},
    {"name": "King Corona Cigars", "industry": "restaurant", "url": "kingcoronacigars.com"},
    {"name": "Tabanero Cigars", "industry": "boutique", "url": "tabanerocigars.com"},
    {"name": "7th+Grove", "industry": "restaurant", "url": "7thandgrove.com"},
    {"name": "Barterhouse Ybor", "industry": "restaurant", "url": "barterhouseybor.com"},
    {"name": "Bernini of Ybor", "industry": "restaurant", "url": "berniniybor.com"},
    {"name": "Acropolis Greek Taverna", "industry": "restaurant", "url": "acropolistampa.com"},
    {"name": "Cigar City Cider & Mead", "industry": "restaurant", "url": "cigarcitycider.com"},
    {"name": "Copper Shaker Ybor", "industry": "restaurant", "url": "coppershaker.com"},
    {"name": "The Castle", "industry": "general", "url": "castleybor.com"},
    {"name": "First Chance Last Chance", "industry": "restaurant", "url": "firstchancelastchance.com"},
    {"name": "Bad Monkey Ybor", "industry": "restaurant", "url": "badmonkeyybor.com"},
    {"name": "Gaspar's Grotto", "industry": "restaurant", "url": "gasparsgrotto.com"},
    {"name": "The Dirty Shame", "industry": "restaurant", "url": "thedirtyshame.com"},
    {"name": "Ybor City Tap House", "industry": "restaurant", "url": "yborcitytaphouse.com"},
    {"name": "Tequila's Ybor", "industry": "restaurant", "url": "tequilasybor.com"},
    {"name": "Southern Belle", "industry": "boutique", "url": "southernbellefl.com"},
    {"name": "La France", "industry": "boutique", "url": "lafranceybor.com"},
    {"name": "Dysfunctional Grace", "industry": "boutique", "url": "dysfunctionalgrace.com"},
    {"name": "Ybor City Wine Bar", "industry": "restaurant", "url": "yborcitywinebar.com"},
    {"name": "J.C. Newman Cigar Museum", "industry": "general", "url": "jcnewman.com"},
    {"name": "Ybor City State Museum", "industry": "general", "url": "ybormuseum.org"},
    {"name": "Casa Santo Stefano", "industry": "restaurant", "url": "casasantostefano.com"},
    {"name": "Flanagan's Irish Pub", "industry": "restaurant", "url": "flanagansirishpub.net"},
    {"name": "Dunedin Blue Jays", "industry": "general", "url": "milb.com/dunedin"},
    {"name": "Clearwater Threshers", "industry": "general", "url": "milb.com/clearwater"},
    {"name": "Tampa Tarpons", "industry": "general", "url": "milb.com/tampa"},
    {"name": "George M. Steinbrenner Field", "industry": "general", "url": "gmsstadium.com"},
    {"name": "Water Street Tampa", "industry": "general", "url": "waterstreettampa.com"},
    {"name": "Channelside Bay Plaza", "industry": "general", "url": "channelsidebayplaza.com"},
    {"name": "Tampa Convention Center", "industry": "general", "url": "tampaconventioncenter.com"},
    {"name": "Curtis Hixon Park", "industry": "general", "url": "tampagov.net"},
    {"name": "Tampa Theatre", "industry": "general", "url": "tampatheatre.org"},
    {"name": "Florida Museum of Photo", "industry": "general", "url": "fmopa.org"},
    {"name": "Henry B. Plant Museum", "industry": "general", "url": "plantmuseum.com"},
    {"name": "UT Sykes Chapel", "industry": "general", "url": "ut.edu"},
]

# Known duplicates to skip (already in directory from previous batches)
KNOWN_DUPES = [
    "columbiarestaurant.com", "sparkmanwharf.com", "armatureworks.com",
    "flaquarium.org", "amaliearena.com", "strazcenter.org",
    "glazermuseum.org", "tampamuseum.org", "hotelhaya.com",
    "hilton.com", "revolve.com",  # revolve.com is the fashion brand, not local
]

def get_existing_websites():
    """Fetch all existing directory listing websites to prevent duplicates."""
    url = f"{SUPABASE_URL}/rest/v1/directory_listings?select=website,business_name&limit=500"
    res = requests.get(url, headers=HEADERS)
    data = res.json()
    websites = set()
    for d in data:
        w = (d.get("website") or "").replace("https://","").replace("http://","").replace("www.","").split("/")[0].lower()
        if w: websites.add(w)
    return websites

def push_to_crm(biz, listing):
    email = None
    website = biz["url"]
    if not website.startswith("http"): website = "https://" + website
    
    if listing:
        ai = listing.get("ai_scraped_data")
        if isinstance(ai, dict): email = ai.get("email")
    
    if not email:
        domain = website.replace("https://","").replace("http://","").replace("www.","").split("/")[0]
        if domain and "." in domain: email = f"info@{domain}"
    
    if not email: return False
    
    lead = {
        "email": email.lower().strip(),
        "user_id": USER_ID,
        "name": biz["name"],
        "company": biz["name"],
        "source": "gl365_directory",
        "status": "new",
        "tags": [biz["industry"], "Tampa Bay", "FL", "directory_import", "batch_5_ybor"],
        "notes": f"Industry: {biz['industry']} | Web: {website}",
        "first_contact_at": "2026-02-06T20:00:00Z",
        "created_at": "2026-02-06T20:00:00Z",
        "updated_at": "2026-02-06T20:00:00Z",
    }
    r = requests.post(f"{SUPABASE_URL}/rest/v1/crm_leads", headers=HEADERS, json=lead)
    return r.status_code in [200, 201]

def scrape(biz):
    url = biz["url"]
    if not url.startswith("http"): url = "https://" + url
    try:
        r = requests.post(API_BASE, json={
            "url": url, "fallback_name": biz["name"],
            "fallback_industry": biz["industry"],
            "fallback_city": "Tampa", "fallback_state": "FL", "tier": "free"
        }, timeout=30)
        data = r.json()
        listing = data.get("listing")
        crm_ok = push_to_crm(biz, listing)
        name = listing["business_name"] if listing else biz["name"]
        return {"status": "ok", "name": name, "crm": " [CRM+]" if crm_ok else " [CRM-]"}
    except Exception as e:
        return {"status": "error", "name": biz["name"], "error": str(e)[:60], "crm": ""}

if __name__ == "__main__":
    existing = get_existing_websites()
    print(f"Found {len(existing)} existing listings in directory")
    
    # Filter out duplicates
    to_process = []
    skipped = 0
    for biz in BATCH:
        domain = biz["url"].replace("https://","").replace("http://","").replace("www.","").split("/")[0].lower()
        if domain in existing or domain in KNOWN_DUPES:
            print(f"  SKIP DUPE: {biz['name']} ({domain})")
            skipped += 1
        else:
            to_process.append(biz)
            existing.add(domain)  # prevent intra-batch dupes
    
    total = len(to_process)
    print(f"\nProcessing {total} new businesses ({skipped} duplicates skipped)...")
    print("=" * 60)
    
    success = errors = 0
    for i, biz in enumerate(to_process):
        result = scrape(biz)
        icon = "+" if result["status"] == "ok" else "X"
        print(f"[{i+1}/{total}] {icon} {result['name']}{result.get('crm','')}")
        if result["status"] == "ok": success += 1
        else:
            errors += 1
            if "error" in result: print(f"    ERR: {result['error']}")
        if i < total - 1: time.sleep(2)
    
    print("=" * 60)
    print(f"Done! {success} loaded, {errors} failed, {skipped} duplicates skipped")
