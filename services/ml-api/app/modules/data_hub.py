from pystac_client import Client
import datetime

EARTH_SEARCH_API_URL = "https://earth-search.aws.element84.com/v1"

def search_scenes(bbox: list[float], max_cloud_cover: int = 100) -> list[dict]:
    """
    Searches for satellite scenes using the STAC API (Earth Search v1).
    """
    try:
        client = Client.open(EARTH_SEARCH_API_URL)
        
        # Search for Sentinel-2 data in the last 30 days
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=30)
        time_range = f"{start_date.strftime('%Y-%m-%dT%H:%M:%SZ')}/{end_date.strftime('%Y-%m-%dT%H:%M:%SZ')}"

        search = client.search(
            max_items=10,
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=time_range,
            query={"eo:cloud_cover": {"lte": max_cloud_cover}}
        )

        items = search.item_collection()
        
        results = []
        for item in items:
            props = item.properties
            
            # Extract basic info
            results.append({
                "id": item.id,
                "date": props.get("datetime", "").split("T")[0],
                "cloudCover": round(props.get("eo:cloud_cover", 0), 1),
                "ndvi": round(0.5 + (0.3 * (100 - props.get("eo:cloud_cover", 0)) / 100), 2), # Mock NDVI for now
                "sensor": "Sentinel-2",
                "thumbnail": "from-emerald-900 to-emerald-700", # UI gradient mock
                "price": 0 # Public data
            })
            
        return results

    except Exception as e:
        print(f"Error searching STAC API: {e}")
        # Return a fallback or re-raise
        raise e
