from pystac_client import Client
import datetime

EARTH_SEARCH_API_URL = "https://earth-search.aws.element84.com/v1"


def _calculate_scene_price(cloud_cover: float, date_str: str, gsd_meters: float = 10.0) -> float:
    """
    Calculate estimated commercial price PER SCENE.
    Based on real market rates: Sentinel-class archive = $5-$20/scene,
    commercial high-res tasking = $50-$150/scene.
    """
    # Base price per scene (not per km²!)
    base = 12.0  # Average archive scene price

    # Resolution tier
    if gsd_meters < 1.0:
        base = 80.0    # Commercial high-res (Maxar/Airbus class)
    elif gsd_meters < 5.0:
        base = 35.0    # Medium-res commercial
    # else: default $12 for 10m+ (Sentinel class)

    # Freshness bonus
    if date_str:
        try:
            item_date = datetime.datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
            age_days = (datetime.datetime.now() - item_date).days
            if age_days <= 2:
                base *= 2.5   # Very fresh = premium
            elif age_days <= 7:
                base *= 1.6
            elif age_days <= 30:
                base *= 1.2
            elif age_days > 365:
                base *= 0.6   # Old archive = discount
        except ValueError:
            pass

    # Cloud cover adjustment
    if cloud_cover < 5.0:
        base *= 1.4    # Crystal clear = premium
    elif cloud_cover > 50.0:
        base *= 0.3    # Mostly clouds = heavy discount

    return round(max(3.0, min(base, 200.0)), 2)  # Clamp to $3 - $200


def search_scenes(bbox: list[float], max_cloud_cover: int = 100, max_items: int = 100) -> list[dict]:
    """
    Searches for satellite scenes using the STAC API (Earth Search v1).
    Returns up to max_items results with preview images and commercial pricing.
    """
    try:
        client = Client.open(EARTH_SEARCH_API_URL)

        # Search Sentinel-2 archive up to 3 years back
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=1095)
        time_range = f"{start_date.strftime('%Y-%m-%dT%H:%M:%SZ')}/{end_date.strftime('%Y-%m-%dT%H:%M:%SZ')}"

        search = client.search(
            max_items=max_items,
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

            # ── Thumbnail (low-res, for grid cards) ──
            thumbnail_url = ""
            if "thumbnail" in assets:
                thumbnail_url = assets["thumbnail"].href
            elif "rendered_preview" in assets:
                thumbnail_url = assets["rendered_preview"].href

            # ── Full-quality preview (for lightbox) ──
            # rendered_preview is a browser-viewable PNG (~1000px)
            # "visual" is a GeoTIFF (.tif) which browsers CANNOT display
            fullres_url = ""
            if "rendered_preview" in assets:
                fullres_url = assets["rendered_preview"].href
            elif "thumbnail" in assets:
                fullres_url = assets["thumbnail"].href

            # ── Metadata ──
            cloud_cover = props.get("eo:cloud_cover", 0)
            date_str = props.get("datetime", "")
            gsd = props.get("gsd", 10.0)

            # ── Price (per scene, reasonable range) ──
            price = _calculate_scene_price(cloud_cover, date_str, gsd)

            # ── NDVI estimate from cloud cover ──
            ndvi_estimate = round(0.35 + (0.45 * (100 - cloud_cover) / 100), 2)

            results.append({
                "id": item.id,
                "date": date_str.split("T")[0] if date_str else "",
                "cloudCover": round(cloud_cover, 1),
                "ndvi": ndvi_estimate,
                "sensor": f"Sentinel-2 ({gsd}m)",
                "thumbnail": thumbnail_url,
                "fullres": fullres_url,
                "price": price,
            })

        return results

    except Exception as e:
        print(f"Error searching STAC API: {e}")
        raise e
