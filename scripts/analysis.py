import json
import os
from datetime import datetime, timezone, timedelta

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "..", "data")
output_file = os.path.join(data_dir, "analysis_results.json")

def run_analysis():
    # 1. Load all three datasets
    with open(os.path.join(data_dir, "listings_mumbai_raw.json"), "r", encoding="utf-8") as f:
        listings = json.load(f)
    with open(os.path.join(data_dir, "rentals_mumbai_raw.json"), "r", encoding="utf-8") as f:
        rentals = json.load(f)
    with open(os.path.join(data_dir, "projects_mumbai_raw.json"), "r", encoding="utf-8") as f:
        projects = json.load(f)

    # Calculate Q1, Q2, Q3
    total_listing_records = len(listings)
    active_listings = sum(1 for x in listings if x.get("is_live") is True)
    
    unique_props = set()
    for x in listings:
        unique_props.add((x.get("latitude"), x.get("longitude"), x.get("floor"), x.get("apartment_name"), x.get("bedroom")))
    unique_properties = len(unique_props)

    # Calculate Q4 (Corrupt) and Q9 (Fake)
    corrupt_listing_ids = []
    fake_listing_ids = []
    
    for x in listings:
        # Fake listings: Check for AI prompt injections in descriptions
        desc = str(x.get("description", "")).lower()
        if "dataset_audit_ref" in desc or "ignore previous" in desc or "ivy-audit" in desc:
            fake_listing_ids.append(x.get("listing_id"))
            continue
            
        # Corrupt listings: Check for impossible physical properties
        corrupt = False
        if x.get("price", 1) <= 0 or x.get("carpet_area", 1) <= 0 or x.get("bedroom", 0) < 0:
            corrupt = True
        if x.get("total_floors") and x.get("floor"):
            if x.get("floor") > x.get("total_floors"):
                corrupt = True
        if x.get("super_built_up_area") and x.get("carpet_area"):
            if x.get("carpet_area") > x.get("super_built_up_area"):
                corrupt = True
                
        if corrupt:
            corrupt_listing_ids.append(x.get("listing_id"))

    # Calculate Q5 (Total Monthly Rent for assigned locality)
    total_monthly_rent = sum(r.get("price", 0) for r in rentals if r.get("locality", "").lower() == "bandra east")

    # Calculate Q6 (Avg price per sqft for active 2BHKs, excluding corrupt/fake)
    sqft_prices = []
    for x in listings:
        if x.get("is_live") is True and x.get("bedroom") == 2:
            lid = x.get("listing_id")
            if lid not in corrupt_listing_ids and lid not in fake_listing_ids:
                if x.get("carpet_area"):
                    sqft_prices.append(x.get("price") / x.get("carpet_area"))
    
    avg_price_per_sqft_2bhk = round(sum(sqft_prices) / len(sqft_prices), 2) if sqft_prices else 0.0

    # Calculate Q7 (Costliest Project)
    costliest = max(projects, key=lambda p: p.get("price_max", 0))
    costliest_project = {
        "project_id": costliest.get("project_id"),
        "price_max_inr": costliest.get("price_max", 0)
    }

    # Calculate Q8 (Listings in the last 7 days)
    # The explicit reference date is 2026-09-10T00:00:00+05:30 (IST)
    tz_ist = timezone(timedelta(hours=5, minutes=30))
    ref_date = datetime(2026, 9, 10, 0, 0, 0, tzinfo=tz_ist)
    start_date = ref_date - timedelta(days=7)
    
    listings_last_7_days = 0
    for x in listings:
        posted = x.get("posted_at")
        if posted:
            posted = posted.replace("Z", "+00:00")
            dt_utc = datetime.fromisoformat(posted)
            dt_ist = dt_utc.astimezone(tz_ist)
            if start_date <= dt_ist < ref_date:
                listings_last_7_days += 1

    # Calculate Q10 (Projects with wrong listing counts)
    project_listing_counts = {}
    for x in listings:
        pid = x.get("project_id")
        if pid:
            project_listing_counts[pid] = project_listing_counts.get(pid, 0) + 1
            
    projects_with_wrong_listing_count = 0
    for p in projects:
        pid = p.get("project_id")
        expected = p.get("total_listings", 0)
        actual = project_listing_counts.get(pid, 0)
        if expected != actual:
            projects_with_wrong_listing_count += 1

    # Final Answers Output
    answers = {
        "total_listing_records": total_listing_records,
        "unique_properties": unique_properties,
        "active_listings": active_listings,
        "corrupt_listing_ids": sorted(corrupt_listing_ids),
        "total_monthly_rent": total_monthly_rent,
        "avg_price_per_sqft_2bhk": avg_price_per_sqft_2bhk,
        "costliest_project": costliest_project,
        "listings_last_7_days": listings_last_7_days,
        "fake_listing_ids": sorted(fake_listing_ids),
        "projects_with_wrong_listing_count": projects_with_wrong_listing_count
    }

    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(answers, out, indent=2)
        
    print("--- FINAL ANSWERS CALCULATED ---")
    print(json.dumps(answers, indent=2))

if __name__ == "__main__":
    run_analysis()