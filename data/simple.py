import json
from pathlib import Path


def deduplicate_listings_from_file(
    input_file: str | Path,
    output_file: str | Path | None = None
) -> list[dict]:
    input_path = Path(input_file)

    # 1. Load JSON data from file
    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # If the JSON is wrapped (e.g. {"results": [...]}), unwrap it
    if isinstance(data, dict):
        listings = data.get("results", [])
    elif isinstance(data, list):
        listings = data
    else:
        raise ValueError("Unsupported JSON structure: expected list or object containing 'results'.")

    # 2. Deduplicate based on (locality, floor, apartment_name)
    seen = set()
    unique_records = []

    for item in listings:
        locality = str(item.get("locality") or "").strip().lower()
        floor = str(item.get("floor") if item.get("floor") is not None else "na").strip()
        apartment = str(item.get("apartment_name") or "").strip().lower()

        composite_key = (locality, floor, apartment)

        if composite_key not in seen:
            seen.add(composite_key)
            unique_records.append(item)

    print(f"Total records read: {len(listings)}")
    print(f"Unique records found: {len(unique_records)}")
    print(f"Duplicates removed: {len(listings) - len(unique_records)}")

    # 3. Optionally save the deduplicated records to a new file
    if output_file:
        out_path = Path(output_file)
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(unique_records, f, indent=2, ensure_ascii=False)
        print(f"Saved deduplicated data to {out_path}")

    return unique_records


if __name__ == "__main__":
    # Example usage:
    INPUT_PATH = "D:\ivy_homes_assignment\data\projects_mumbai_raw.json"
    OUTPUT_PATH = "D:\ivy_homes_assignment\data\listings_mumbai_unique.json"

    unique_data = deduplicate_listings_from_file(INPUT_PATH, OUTPUT_PATH)