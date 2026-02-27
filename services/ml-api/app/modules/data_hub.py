from pystac_client import Client
import datetime
import os
import json

EARTH_SEARCH_API_URL = "https://earth-search.aws.element84.com/v1"

# ─── Supabase Client (lazy init) ─────────────────────────────────────────────
_supabase_client = None

def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if url and key:
            from supabase import create_client
            _supabase_client = create_client(url, key)
    return _supabase_client


def _save_scenes_to_db(scenes: list[dict], bbox: list[float]):
    """Save/upsert scenes to Supabase satellite_scenes table (fire-and-forget)."""
    try:
        sb = _get_supabase()
        if not sb:
            return

        rows = []
        for s in scenes:
            rows.append({
                "scene_id": s["id"],
                "captured_at": f'{s["date"]}T00:00:00Z' if s["date"] else None,
                "cloud_cover": s["cloudCover"],
                "sensor_type": s["sensor"],
                "thumbnail_url": s["thumbnail"],
                "estimated_price": s["price"],
                "bbox": json.dumps(bbox),
                "metadata": json.dumps({
                    "ndvi": s["ndvi"],
                    "fullres": s["fullres"],
                })
            })

        if rows:
            # Upsert: if scene_id already exists, update it; otherwise insert
            sb.table("satellite_scenes").upsert(rows, on_conflict="scene_id").execute()
            print(f"[DataHub] Saved {len(rows)} scenes to Supabase")
    except Exception as e:
        # Don't crash the search if DB save fails
        print(f"[DataHub] Warning: failed to save scenes to DB: {e}")


def _calculate_scene_price(cloud_cover: float, date_str: str, gsd_meters: float = 10.0) -> float:
    """
    Calculate estimated commercial price PER SCENE.
    Based on real market rates: Sentinel-class archive = $5-$20/scene,
    commercial high-res tasking = $50-$150/scene.
    """
    base = 12.0

    if gsd_meters < 1.0:
        base = 80.0
    elif gsd_meters < 5.0:
        base = 35.0

    if date_str:
        try:
            item_date = datetime.datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
            age_days = (datetime.datetime.now() - item_date).days
            if age_days <= 2:
                base *= 2.5
            elif age_days <= 7:
                base *= 1.6
            elif age_days <= 30:
                base *= 1.2
            elif age_days > 365:
                base *= 0.6
        except ValueError:
            pass

    if cloud_cover < 5.0:
        base *= 1.4
    elif cloud_cover > 50.0:
        base *= 0.3

    return round(max(3.0, min(base, 200.0)), 2)


def search_scenes(bbox: list[float], max_cloud_cover: int = 100, max_items: int = 100) -> list[dict]:
    """
    Searches for satellite scenes using the STAC API (Earth Search v1).
    Returns up to max_items results and saves them to Supabase automatically.
    """
    try:
        client = Client.open(EARTH_SEARCH_API_URL)

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

            # ── Thumbnail (small, for grid cards) ──
            thumbnail_url = ""
            if "thumbnail" in assets:
                thumbnail_url = assets["thumbnail"].href
            elif "rendered_preview" in assets:
                thumbnail_url = assets["rendered_preview"].href

            # ── Full-quality image (for lightbox) ──
            # Priority 1: Official rendered_preview (Stable, no rate limits, usually ~1024px)
            # Priority 2: Titiler (High-res 2048px, but has rate limits - good for Wow-effect)
            # Priority 3: Thumbnail fallback
            fullres_url = ""
            
            # Official high-quality preview (Safe & Fast)
            official_preview = assets.get("rendered_preview", {}).get("href")
            
            if official_preview:
                fullres_url = official_preview
            elif "visual" in assets:
                from urllib.parse import quote
                # Using community Titiler for demo. For production, host your own instance!
                cog_url = assets["visual"].href
                fullres_url = f"https://titiler.xyz/cog/preview.png?url={quote(cog_url, safe='')}&max_size=2048"
            
            if not fullres_url:
                fullres_url = thumbnail_url

            cloud_cover = props.get("eo:cloud_cover", 0)
            date_str = props.get("datetime", "")
            gsd = props.get("gsd", 10.0)

            price = _calculate_scene_price(cloud_cover, date_str, gsd)
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

        # ── Auto-save to Supabase (fire-and-forget) ──
        _save_scenes_to_db(results, bbox)

        return results

    except Exception as e:
        print(f"Error searching STAC API: {e}")
        raise e
