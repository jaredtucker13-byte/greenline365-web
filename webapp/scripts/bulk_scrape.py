#!/usr/bin/env python3
"""
GL365 Directory Bulk Loader
Scrapes websites and creates directory listings via the API.
"""
import json
import time
import requests

API_BASE = "http://localhost:3000/api/directory/scrape"

BATCH_1 = [
    {"name": "Hoffman Electrical & A/C", "industry": "electrical", "url": "hoffmanelectrical.com"},
    {"name": "Tampa Spark Masters Electric", "industry": "electrical", "url": "tampasparkmasters.com"},
    {"name": "Aguila Electrical Services Inc", "industry": "electrical", "url": "aguilaelectrical.com"},
    {"name": "Acme Electrical Services", "industry": "electrical", "url": "acmeelectricalservices.com"},
    {"name": "Energy Today", "industry": "electrical", "url": "energytoday.biz"},
    {"name": "Luminous Electric", "industry": "electrical", "url": "lumelect.com"},
    {"name": "Bolt Electric", "industry": "electrical", "url": "boltelectricfl.com"},
    {"name": "Force Electric", "industry": "electrical", "url": "forceelectricservice.com"},
    {"name": "JDP Electric", "industry": "electrical", "url": "jdpelectric.com"},
    {"name": "Olin Plumbing", "industry": "plumbing", "url": "plumberstampa.com"},
    {"name": "Everyday Plumber", "industry": "plumbing", "url": "everydayplumber.com"},
    {"name": "Pro Plumbing Services", "industry": "plumbing", "url": "proplumbing-air.com"},
    {"name": "Charles Hero Plumbing", "industry": "plumbing", "url": "charlesheroplumbingtampa.com"},
    {"name": "Case Plumbing", "industry": "plumbing", "url": "caseplumbingfl.net"},
    {"name": "Son of A Plumber", "industry": "plumbing", "url": "sonofaplumberinc.com"},
    {"name": "Larson Plumbing", "industry": "plumbing", "url": "larsonplumbing.net"},
    {"name": "Sample Plumbing", "industry": "plumbing", "url": "sampleplumbinginc.com"},
    {"name": "Drain Flo Plumbing", "industry": "plumbing", "url": "drainfloplumbing.com"},
    {"name": "Channelside Plumbing", "industry": "plumbing", "url": "channelsideplumbing.com"},
    {"name": "Redi Rooter Plumbing", "industry": "plumbing", "url": "redirootertampa.com"},
    {"name": "Rolando Sariol Plumbing", "industry": "plumbing", "url": "rolandosariolplumbing.com"},
    {"name": "Matt's Plumbing Service", "industry": "plumbing", "url": "mattsplumbingtampa.com"},
    {"name": "JJM Plumbing", "industry": "plumbing", "url": "jjmplumbingfl.com"},
    {"name": "Ethical Air and Plumbing", "industry": "hvac", "url": "ethicalairandplumbing.com"},
    {"name": "Third Generation Plumbing", "industry": "plumbing", "url": "thirdgenerationplumbing.com"},
    {"name": "Peninsular Plumbing", "industry": "plumbing", "url": "peninsularplumbing.com"},
    {"name": "Gulf Coast Air Systems", "industry": "hvac", "url": "gulfcoastairsystems.com"},
    {"name": "McMullen Air Conditioning", "industry": "hvac", "url": "mcmullenhvac.com"},
    {"name": "Tudi Mechanical Systems", "industry": "hvac", "url": "tudi.com"},
    {"name": "Fadeology Barbershop", "industry": "barbershop", "url": "fadeology.com"},
    {"name": "Cigar City Barbershop", "industry": "barbershop", "url": "cigarcitybarbershop.com"},
    {"name": "The Heritage Club Barbershop", "industry": "barbershop", "url": "heritageclubbarbershop.com"},
    {"name": "Exclusive Barbers Tampa Inc", "industry": "barbershop", "url": "exclusivebarberstampa.com"},
    {"name": "The Barbershop by Salon Inga", "industry": "barbershop", "url": "thebarbershoptampa.com"},
    {"name": "Barber Co", "industry": "barbershop", "url": "barbercotampa.com"},
    {"name": "SOHO Shave Co.", "industry": "barbershop", "url": "sohoshaveco.com"},
    {"name": "Playa Family Dentistry", "industry": "general", "url": "playafamilydentistry.com"},
    {"name": "Sunshine Creative Smiles", "industry": "general", "url": "sunshinecreativesmiles.com"},
    {"name": "Tampa Dental", "industry": "general", "url": "tampadental.com"},
    {"name": "Sunshine Dentistry Tampa", "industry": "general", "url": "sunshinedentistrytampa.com"},
    {"name": "Ocean Prime Tampa", "industry": "restaurant", "url": "ocean-prime.com"},
    {"name": "La Segunda Bakery", "industry": "bakery", "url": "lasegundabakery.com"},
    {"name": "HaleLife Bakery", "industry": "bakery", "url": "halelifebakery.com"},
    {"name": "Black English Bookstore", "industry": "boutique", "url": "bookshop.org"},
    {"name": "Tampa Bay History Center", "industry": "general", "url": "tampabayhistorycenter.org"},
    {"name": "Hogan Made", "industry": "boutique", "url": "hoganmade.com"},
    {"name": "The Cabana South", "industry": "boutique", "url": "thecabanasouth.com"},
    {"name": "Urban Native Co", "industry": "boutique", "url": "urbannativeco.com"},
    {"name": "Fin and Rudder", "industry": "boutique", "url": "finandrudder.com"},
]

BATCH_2 = [
    {"name": "Greg Bailey Automotive", "industry": "general", "url": "automotiverepairtampa.com"},
    {"name": "Lightning Auto Repair and Tires", "industry": "general", "url": "lightningautorepair.com"},
    {"name": "AutoWorks of Tampa", "industry": "general", "url": "autoworksoftampa.com"},
    {"name": "Running Great", "industry": "general", "url": "runninggreatauto.com"},
    {"name": "Hill Ward Henderson", "industry": "general", "url": "hwhlaw.com"},
    {"name": "Akerman LLP", "industry": "general", "url": "akerman.com"},
    {"name": "Gunster", "industry": "general", "url": "gunster.com"},
    {"name": "Bush Ross, P.A.", "industry": "general", "url": "bushross.com"},
    {"name": "Holland & Knight LLP", "industry": "general", "url": "hklaw.com"},
    {"name": "Carlton Fields", "industry": "general", "url": "carltonfields.com"},
    {"name": "Bradley Arant Boult Cummings", "industry": "general", "url": "bradley.com"},
    {"name": "Greenberg Traurig", "industry": "general", "url": "gtlaw.com"},
    {"name": "Foley & Lardner", "industry": "general", "url": "foley.com"},
    {"name": "Older Lundy Koch & Martino", "industry": "general", "url": "olalaw.com"},
    {"name": "Snap Fitness Tampa", "industry": "gym", "url": "snapfitness.com"},
    {"name": "Gold's Gym Tampa Gas Worx", "industry": "gym", "url": "goldsgymgasworx.com"},
    {"name": "EoS Fitness", "industry": "gym", "url": "eosfitness.com"},
    {"name": "Bayshore Fit", "industry": "gym", "url": "bayshorefit.com"},
    {"name": "Deborah Kent's", "industry": "boutique", "url": "deborahkents.com"},
    {"name": "Don Me Now", "industry": "boutique", "url": "donmenow.com"},
    {"name": "Heads & Tails", "industry": "boutique", "url": "theheadsandtails.com"},
    {"name": "Hazel and Dot", "industry": "boutique", "url": "hazelanddot.com"},
    {"name": "Chic Eccentric", "industry": "boutique", "url": "chiceccentrics.com"},
    {"name": "Gemelo Adventures", "industry": "general", "url": "gemeloadventures.com"},
    {"name": "The Part Pal", "industry": "general", "url": "thepartpal.com"},
    {"name": "B&B Sports", "industry": "boutique", "url": "bbsportswear.com"},
    {"name": "Bern's Steak House", "industry": "restaurant", "url": "bernssteakhouse.com"},
    {"name": "Columbia Restaurant", "industry": "restaurant", "url": "columbiarestaurant.com"},
    {"name": "Olivia", "industry": "restaurant", "url": "oliviatampa.com"},
    {"name": "Sunda New Asian", "industry": "restaurant", "url": "sundanewasian.com"},
    {"name": "Oggi Italian", "industry": "restaurant", "url": "oggitalian.com"},
    {"name": "Rocca", "industry": "restaurant", "url": "roccatampa.com"},
    {"name": "Tori Bar", "industry": "restaurant", "url": "toritampa.com"},
    {"name": "Gin Joint", "industry": "restaurant", "url": "ginjointtampa.com"},
    {"name": "Union New American", "industry": "restaurant", "url": "unionnewamerican.com"},
    {"name": "Ponte Modern American", "industry": "restaurant", "url": "pontetampa.com"},
    {"name": "Oxford Exchange", "industry": "restaurant", "url": "oxfordexchange.com"},
    {"name": "Willa's", "industry": "restaurant", "url": "willastampa.com"},
    {"name": "Driftlight", "industry": "restaurant", "url": "driftlightsteakhouse.com"},
    {"name": "Noble Rice", "industry": "restaurant", "url": "noblericeco.com"},
    {"name": "Lona", "industry": "restaurant", "url": "lonatampa.com"},
    {"name": "Elevage", "industry": "restaurant", "url": "elevagetampa.com"},
    {"name": "Anchor & Brine", "industry": "restaurant", "url": "anchorandbrine.com"},
    {"name": "ZooTampa at Lowry Park", "industry": "general", "url": "zootampa.org"},
    {"name": "Florida Aquarium", "industry": "general", "url": "flaquarium.org"},
    {"name": "The Florida Orchestra", "industry": "general", "url": "floridaorchestra.org"},
    {"name": "Straz Center", "industry": "general", "url": "strazcenter.org"},
    {"name": "Glazer Children's Museum", "industry": "general", "url": "glazermuseum.org"},
    {"name": "Mise en Place", "industry": "restaurant", "url": "miseonline.com"},
    {"name": "Ulele", "industry": "restaurant", "url": "ulele.com"},
]

ALL_BUSINESSES = BATCH_1 + BATCH_2

def scrape_business(biz):
    url = biz["url"]
    if not url.startswith("http"):
        url = "https://" + url
    
    payload = {
        "url": url,
        "fallback_name": biz["name"],
        "fallback_industry": biz["industry"],
        "fallback_city": "Tampa",
        "fallback_state": "FL",
        "tier": "free"
    }
    
    try:
        r = requests.post(API_BASE, json=payload, timeout=30)
        data = r.json()
        if data.get("success"):
            name = data["listing"]["business_name"]
            return {"status": "ok", "name": name, "id": data["listing"]["id"]}
        else:
            return {"status": "fallback", "name": biz["name"], "error": data.get("error", "unknown")}
    except Exception as e:
        return {"status": "error", "name": biz["name"], "error": str(e)}

if __name__ == "__main__":
    success = 0
    errors = 0
    total = len(ALL_BUSINESSES)
    
    print(f"Starting bulk load of {total} businesses...")
    print("=" * 60)
    
    for i, biz in enumerate(ALL_BUSINESSES):
        result = scrape_business(biz)
        status_icon = "+" if result["status"] == "ok" else "~" if result["status"] == "fallback" else "X"
        print(f"[{i+1}/{total}] {status_icon} {result['name']}")
        
        if result["status"] in ["ok", "fallback"]:
            success += 1
        else:
            errors += 1
            print(f"    ERROR: {result.get('error', '')[:80]}")
        
        # Rate limit
        if i < total - 1:
            time.sleep(2)
    
    print("=" * 60)
    print(f"Done! {success} loaded, {errors} failed out of {total}")
