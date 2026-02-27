from pystac_client import Client

EARTH_SEARCH_API_URL = "https://earth-search.aws.element84.com/v1"
client = Client.open(EARTH_SEARCH_API_URL)
search = client.search(
    max_items=1,
    collections=["sentinel-2-l2a"],
    query={"eo:cloud_cover": {"lte": 5}}
)
items = list(search.items())
if items:
    print("Visual URL:", items[0].assets.get("visual", {}).get("href", "not found"))
    print("Thumbnail URL:", items[0].assets.get("thumbnail", {}).get("href", "not found"))
    print("Rendered Preview URL:", items[0].assets.get("rendered_preview", {}).get("href", "not found"))
else:
    print("No items found.")
