#!/usr/bin/env python3
"""GL365 Directory Bulk Loader - Batches 3 & 4 (100 businesses)"""
import json, time, requests

API_BASE = "http://localhost:3000/api/directory/scrape"

BATCH_3 = [
    {"name": "Westchase Roofing Services", "industry": "roofing", "url": "westchaseroofing.com"},
    {"name": "Dynamic Roofing Concepts", "industry": "roofing", "url": "dynamicroofingconcepts.com"},
    {"name": "Arry's Roofing Services", "industry": "roofing", "url": "arrysroofing.com"},
    {"name": "Stay Dry Roofing", "industry": "roofing", "url": "staydryroofing.com"},
    {"name": "Landmark Pools", "industry": "general", "url": "landmarkpools.com"},
    {"name": "Olympus Pools", "industry": "general", "url": "olympuspools.com"},
    {"name": "Challenger Pools", "industry": "general", "url": "challengerpools.com"},
    {"name": "Tampa Bay Solar", "industry": "general", "url": "tampabaysolar.com"},
    {"name": "Solar Energy Management", "industry": "general", "url": "solarenergymanagement.com"},
    {"name": "Florida Medical Clinic", "industry": "general", "url": "floridamedicalclinic.com"},
    {"name": "BioSpine Institute", "industry": "general", "url": "biospine.com"},
    {"name": "Tampa General Hospital", "industry": "general", "url": "tgh.org"},
    {"name": "Moffitt Cancer Center", "industry": "general", "url": "moffitt.org"},
    {"name": "Women's Care Florida", "industry": "general", "url": "womenscareobgyn.com"},
    {"name": "South Tampa Dermatology", "industry": "general", "url": "southtampaderm.com"},
    {"name": "For Your Eyes Only", "industry": "general", "url": "foryoureyesonly.com"},
    {"name": "Florida Orthopaedic Institute", "industry": "general", "url": "floridaortho.com"},
    {"name": "Pop-A-Lock Tampa", "industry": "general", "url": "popalocktampa.com"},
    {"name": "Cheap Locksmith Tampa", "industry": "general", "url": "cheaplocksmithtampa.com"},
    {"name": "Dash Lock & Key", "industry": "general", "url": "dashlockandkey.com"},
    {"name": "SiteZeus", "industry": "general", "url": "sitezeus.com"},
    {"name": "Grifin", "industry": "general", "url": "grifin.com"},
    {"name": "ComplianceQuest", "industry": "general", "url": "compliancequest.com"},
    {"name": "HOMEE", "industry": "general", "url": "homee.com"},
    {"name": "Intezyne Technologies", "industry": "general", "url": "intezyne.com"},
    {"name": "Armature Works", "industry": "restaurant", "url": "armatureworks.com"},
    {"name": "Sparkman Wharf", "industry": "restaurant", "url": "sparkmanwharf.com"},
    {"name": "Hotel Haya", "industry": "general", "url": "hotelhaya.com"},
    {"name": "The Epicurean Hotel", "industry": "general", "url": "epicureanhotel.com"},
    {"name": "JW Marriott Tampa Water Street", "industry": "general", "url": "marriott.com"},
    {"name": "Floridan Palace Hotel", "industry": "general", "url": "floridanpalace.com"},
    {"name": "Pane Rustica", "industry": "bakery", "url": "panerustica.com"},
    {"name": "Alessi Bakery", "industry": "bakery", "url": "alessibakery.com"},
    {"name": "Piquant Epicurean Boutique", "industry": "bakery", "url": "piquanttampa.com"},
    {"name": "Datz", "industry": "restaurant", "url": "datztampa.com"},
    {"name": "Edison: Food+Drink Lab", "industry": "restaurant", "url": "edison-tampa.com"},
    {"name": "Haven", "industry": "restaurant", "url": "haventampa.com"},
    {"name": "Malio's Prime Steakhouse", "industry": "restaurant", "url": "maliosprime.com"},
    {"name": "Jackson's Bistro", "industry": "restaurant", "url": "jacksonsbistro.com"},
    {"name": "Oystercatchers", "industry": "restaurant", "url": "oystercatchersrestaurant.com"},
    {"name": "American Social", "industry": "restaurant", "url": "americansocialbar.com"},
    {"name": "Hattricks", "industry": "restaurant", "url": "hattrickstampa.com"},
    {"name": "Tampa Bay Lightning", "industry": "general", "url": "amaliearena.com"},
    {"name": "Busch Gardens Tampa Bay", "industry": "general", "url": "buschgardens.com"},
    {"name": "Adventure Island", "industry": "general", "url": "adventureisland.com"},
    {"name": "MOSI", "industry": "general", "url": "mosi.org"},
    {"name": "Tampa Museum of Art", "industry": "general", "url": "tampamuseum.org"},
    {"name": "Stageworks Theatre", "industry": "general", "url": "stageworkstheatre.org"},
    {"name": "Raymond James Stadium", "industry": "general", "url": "raymondjamesstadium.com"},
    {"name": "Strategic Property Partners", "industry": "general", "url": "spptampa.com"},
]

BATCH_4 = [
    {"name": "Hawkins Service Company", "industry": "hvac", "url": "hawkinsserviceco.com"},
    {"name": "Climate Design Home Services", "industry": "hvac", "url": "climatedesign.com"},
    {"name": "Del-Air Plumbing & Electrical", "industry": "hvac", "url": "delair.com"},
    {"name": "ABC Plumbing, Air & Heat", "industry": "hvac", "url": "4abc.com"},
    {"name": "St. Pete Plumbing", "industry": "plumbing", "url": "stpeteplumbing.com"},
    {"name": "Senica Air Conditioning", "industry": "hvac", "url": "senicaair.com"},
    {"name": "Hiller Electrical", "industry": "electrical", "url": "hillerelectrical.com"},
    {"name": "Luma Electric", "industry": "electrical", "url": "lumaelectric.com"},
    {"name": "Pinellas County Plumbing", "industry": "plumbing", "url": "pinellascountyplumbing.com"},
    {"name": "Suncoast Roofer", "industry": "roofing", "url": "suncoastroofer.com"},
    {"name": "Fresco's Waterfront Bistro", "industry": "restaurant", "url": "frescoswaterfront.com"},
    {"name": "Red Mesa Restaurant", "industry": "restaurant", "url": "redmesa.com"},
    {"name": "Parkshore Grill", "industry": "restaurant", "url": "parkshoregrill.com"},
    {"name": "Noble Crust St. Pete", "industry": "restaurant", "url": "noble-crust.com"},
    {"name": "Cassis St. Petersburg", "industry": "restaurant", "url": "cassisstpete.com"},
    {"name": "The Frog Pond", "industry": "restaurant", "url": "frogponddowntown.com"},
    {"name": "GateWay Subs", "industry": "restaurant", "url": "gatewaysubs.com"},
    {"name": "Grand Central Brewhouse", "industry": "restaurant", "url": "grandcentralbrew.com"},
    {"name": "Gypsy Souls Coffeehouse", "industry": "restaurant", "url": "gypsysoulscoffeehouse.com"},
    {"name": "Lolita's Wine Market", "industry": "restaurant", "url": "lolitaswinemarket.com"},
    {"name": "The St. Pete Store", "industry": "boutique", "url": "thestpetestore.com"},
    {"name": "Marion's Gifts & Clothing", "industry": "boutique", "url": "marionsgifts.com"},
    {"name": "Sartorial Inc.", "industry": "boutique", "url": "sartorialinc.com"},
    {"name": "Twig", "industry": "boutique", "url": "shoptwig.com"},
    {"name": "Misred Outfitters", "industry": "boutique", "url": "shopmisred.com"},
    {"name": "Bruté Fashion", "industry": "boutique", "url": "brutefashion.com"},
    {"name": "Matter of Fact", "industry": "boutique", "url": "matteroffact.com"},
    {"name": "Atlas Body + Home", "industry": "boutique", "url": "atlasbodyandhome.com"},
    {"name": "Zazoo'd", "industry": "boutique", "url": "zazood.com"},
    {"name": "Plain Jane", "industry": "boutique", "url": "plainjanestpete.com"},
    {"name": "Uptown Barber Bar", "industry": "barbershop", "url": "uptownbarberbar.com"},
    {"name": "The Shave Cave", "industry": "barbershop", "url": "theshavecave.com"},
    {"name": "Broken Compass Barber Co.", "industry": "barbershop", "url": "brokencompassbarbercompany.com"},
    {"name": "Central Oak Barber Co.", "industry": "barbershop", "url": "centraloakbarberco.com"},
    {"name": "Billy's Corner Barber Shop", "industry": "barbershop", "url": "billyscornerbarbershop.com"},
    {"name": "Number 9 Salon", "industry": "barbershop", "url": "number9salon.com"},
    {"name": "Salon Lofts St. Pete", "industry": "barbershop", "url": "salonlofts.com"},
    {"name": "Jackie Z Style Co.", "industry": "boutique", "url": "jackiezstyle.com"},
    {"name": "Jabil", "industry": "general", "url": "jabil.com"},
    {"name": "Raymond James Financial", "industry": "general", "url": "raymondjames.com"},
    {"name": "Johns Hopkins All Children's", "industry": "general", "url": "hopkinsallchildrens.org"},
    {"name": "Bayfront Health St. Pete", "industry": "general", "url": "bayfrontstpete.com"},
    {"name": "Simply Organic", "industry": "general", "url": "simplyorganicbeauty.com"},
    {"name": "SKUx", "industry": "general", "url": "skux.io"},
    {"name": "ROI Amplified", "industry": "general", "url": "roiamplified.com"},
    {"name": "Salvador Dali Museum", "industry": "general", "url": "thedali.org"},
    {"name": "Museum of Fine Arts", "industry": "general", "url": "mfastpete.org"},
    {"name": "The James Museum", "industry": "general", "url": "thejamesmuseum.org"},
    {"name": "Morean Arts Center", "industry": "general", "url": "moreanartscenter.org"},
    {"name": "St. Pete Pier", "industry": "general", "url": "stpetepier.org"},
]

ALL = BATCH_3 + BATCH_4

# Also push to CRM
SUPABASE_URL = "https://rawlqwjdfzicjepzmcng.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhd2xxd2pkZnppY2plcHptY25nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5NTIwMSwiZXhwIjoyMDc5NzcxMjAxfQ.O2as6N-_5ZcboDVn2AF1rBkGm3yUlaRZ0lfvK3REYIM"
CRM_HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}
USER_ID = "677b536d-6521-4ac8-a0a5-98278b35f4cc"

def push_to_crm(biz, listing):
    email = None
    if listing:
        ai = listing.get("ai_scraped_data") or {}
        email = (listing.get("email") or (ai.get("email") if isinstance(ai, dict) else None))
    
    website = biz["url"]
    if not website.startswith("http"): website = "https://" + website
    
    if not email:
        domain = website.replace("https://","").replace("http://","").replace("www.","").split("/")[0]
        if domain and "." in domain: email = f"info@{domain}"
    
    if not email: return False
    
    city = ""
    if listing:
        city = listing.get("city") or ""
        ai = listing.get("ai_scraped_data")
        if isinstance(ai, dict): city = city or ai.get("city") or ""
    
    lead = {
        "email": email.lower().strip(),
        "user_id": USER_ID,
        "name": biz["name"],
        "phone": (listing or {}).get("phone"),
        "company": biz["name"],
        "source": "gl365_directory",
        "status": "new",
        "tags": [biz["industry"], city or "Tampa Bay", "FL", "directory_import", "batch_3_4"],
        "notes": f"Industry: {biz['industry']} | Web: {website}",
        "first_contact_at": "2026-02-06T12:00:00Z",
        "created_at": "2026-02-06T12:00:00Z",
        "updated_at": "2026-02-06T12:00:00Z",
    }
    
    r = requests.post(f"{SUPABASE_URL}/rest/v1/crm_leads", headers=CRM_HEADERS, json=lead)
    return r.status_code in [200, 201]

def scrape(biz):
    url = biz["url"]
    if not url.startswith("http"): url = "https://" + url
    
    try:
        r = requests.post(API_BASE, json={
            "url": url, "fallback_name": biz["name"],
            "fallback_industry": biz["industry"],
            "fallback_city": "Tampa Bay", "fallback_state": "FL", "tier": "free"
        }, timeout=30)
        data = r.json()
        listing = data.get("listing")
        name = listing["business_name"] if listing else biz["name"]
        
        # Push to CRM too
        crm_ok = push_to_crm(biz, listing)
        crm_tag = " [CRM+]" if crm_ok else " [CRM-]"
        
        return {"status": "ok", "name": name, "crm": crm_tag}
    except Exception as e:
        return {"status": "error", "name": biz["name"], "error": str(e)[:60], "crm": ""}

if __name__ == "__main__":
    total = len(ALL)
    success = errors = 0
    print(f"Processing {total} businesses (Batch 3+4)...")
    print("=" * 60)
    
    for i, biz in enumerate(ALL):
        result = scrape(biz)
        icon = "+" if result["status"] == "ok" else "X"
        print(f"[{i+1}/{total}] {icon} {result['name']}{result.get('crm','')}")
        if result["status"] == "ok": success += 1
        else:
            errors += 1
            if "error" in result: print(f"    ERR: {result['error']}")
        if i < total - 1: time.sleep(2)
    
    print("=" * 60)
    print(f"Done! {success} loaded, {errors} failed out of {total}")
