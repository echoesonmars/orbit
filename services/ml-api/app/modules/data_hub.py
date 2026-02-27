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
            assets = item.assets
            
            # Extract thumbnail if available
            thumbnail_url = ""
            if "rendered_preview" in assets:
                thumbnail_url = assets["rendered_preview"].href
            elif "thumbnail" in assets:
                thumbnail_url = assets["thumbnail"].href
                
            # Calculate dynamic mock price
            cloud_cover = props.get("eo:cloud_cover", 0)
            date_str = props.get("datetime", "")
            
            base_price = 10.0
            
            # Cloud cover premium
            if cloud_cover < 5.0:
                base_price += 5.0
            elif cloud_cover > 50.0:
                base_price -= 5.0
                
            # Date premium
            if date_str:
                try:
                    item_date = datetime.datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
                    age_days = (datetime.datetime.now() - item_date).days
                    if age_days <= 5:
                        base_price += 5.0
                except ValueError:
                    pass
            
            price = max(1.0, round(base_price, 2))
            
            # Extract basic info
            results.append({
                "id": item.id,
                "date": date_str.split("T")[0] if date_str else "",
                "cloudCover": round(cloud_cover, 1),
                "ndvi": round(0.5 + (0.3 * (100 - cloud_cover) / 100), 2), # Mock NDVI for now
                "sensor": "Sentinel-2",
                "thumbnail": thumbnail_url,
                "price": price
            })
            
        return results

    except Exception as e:
        print(f"Error searching STAC API: {e}")
        # Return a fallback or re-raise
        raise e
