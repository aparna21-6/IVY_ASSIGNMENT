import json
import os

# Assuming you run this from the root directory, adjust path if needed
file_path = os.path.join("data", "listings_mumbai_raw.json")

def analyze_listings():
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            listings = json.load(f)
    except FileNotFoundError:
        print(f"Could not find {file_path}. Make sure the file exists and you are running from the root folder.")
        return

    # Question 1: Verify total records
    total_records = len(listings)

    # Question 3: Active listings (is_live == True)
    active_listings = sum(1 for item in listings if item.get("is_live") == True)

    # Question 2: Unique properties
    unique_properties_set = set()
    for item in listings:
        # Create a unique fingerprint for the physical property
        fingerprint = (
            item.get("latitude"),
            item.get("longitude"),
            item.get("floor"),
            item.get("apartment_name"),
            item.get("bedroom")
        )
        unique_properties_set.add(fingerprint)

    unique_properties_count = len(unique_properties_set)

    print("--- PART 2: DATA ANSWERS ---")
    print(f"Q1 (total_listing_records): {total_records}")
    print(f"Q2 (unique_properties):     {unique_properties_count}")
    print(f"Q3 (active_listings):       {active_listings}")
    print("----------------------------")

if __name__ == "__main__":
    analyze_listings()