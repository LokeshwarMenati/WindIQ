"""
Elexon BMRS API Client for FUELHH (Wind actuals) and WINDFOR (Wind forecasts).
Fetches data from official Elexon Insights Solution REST endpoints.
"""

import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

class ElexonClient:
    def __init__(self, cache_dir: str = "backend/data"):
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)
        self.fuelhh_file = os.path.join(self.cache_dir, "fuelhh_wind_jan2026.json")
        self.windfor_file = os.path.join(self.cache_dir, "windfor_jan2026.json")

    def _fetch_stream(self, dataset: str, start_dt: str, end_dt: str) -> List[Dict[str, Any]]:
        """Fetch records from Elexon stream endpoint."""
        url = f"{ELEXON_BASE_URL}/{dataset}/stream?publishDateTimeFrom={urllib.parse.quote(start_dt)}&publishDateTimeTo={urllib.parse.quote(end_dt)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (UK-Wind-DayAhead-Utility/1.0)"})
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data
        except Exception as e:
            print(f"Error fetching {dataset} for {start_dt} to {end_dt}: {e}")
            return []

    def fetch_fuelhh_wind(self, start_dt: str = "2025-12-31T00:00:00Z", end_dt: str = "2026-02-02T00:00:00Z", chunk_days: int = 5) -> List[Dict[str, Any]]:
        """Fetch FUELHH actual generation for fuelType WIND in chunks."""
        start = datetime.fromisoformat(start_dt.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_dt.replace("Z", "+00:00"))
        curr = start
        all_wind = []

        print(f"Fetching FUELHH (WIND) from {start_dt} to {end_dt}...")
        while curr < end:
            next_chunk = min(curr + timedelta(days=chunk_days), end)
            chunk_start_str = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
            chunk_end_str = next_chunk.strftime("%Y-%m-%dT%H:%M:%SZ")
            raw_items = self._fetch_stream("FUELHH", chunk_start_str, chunk_end_str)
            wind_items = [
                {
                    "dataset": item.get("dataset"),
                    "publishTime": item.get("publishTime"),
                    "startTime": item.get("startTime"),
                    "settlementDate": item.get("settlementDate"),
                    "settlementPeriod": item.get("settlementPeriod"),
                    "fuelType": "WIND",
                    "generation": item.get("generation", 0)
                }
                for item in raw_items if item.get("fuelType") == "WIND"
            ]
            all_wind.extend(wind_items)
            print(f"  FUELHH chunk {chunk_start_str} to {chunk_end_str}: got {len(wind_items)} wind items (Total: {len(all_wind)})")
            curr = next_chunk

        # Deduplicate by startTime
        deduped = {}
        for item in all_wind:
            st = item.get("startTime")
            if st:
                # Keep latest if duplicate
                deduped[st] = item
        final_list = sorted(deduped.values(), key=lambda x: x["startTime"])
        print(f"Total unique FUELHH WIND records: {len(final_list)}")
        return final_list

    def fetch_windfor(self, start_dt: str = "2025-12-30T00:00:00Z", end_dt: str = "2026-02-02T00:00:00Z", chunk_days: int = 5) -> List[Dict[str, Any]]:
        """Fetch WINDFOR wind generation forecasts in chunks."""
        start = datetime.fromisoformat(start_dt.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_dt.replace("Z", "+00:00"))
        curr = start
        all_forecasts = []

        print(f"Fetching WINDFOR from {start_dt} to {end_dt}...")
        while curr < end:
            next_chunk = min(curr + timedelta(days=chunk_days), end)
            chunk_start_str = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
            chunk_end_str = next_chunk.strftime("%Y-%m-%dT%H:%M:%SZ")
            raw_items = self._fetch_stream("WINDFOR", chunk_start_str, chunk_end_str)
            for item in raw_items:
                all_forecasts.append({
                    "dataset": "WINDFOR",
                    "publishTime": item.get("publishTime"),
                    "startTime": item.get("startTime"),
                    "generation": item.get("generation", 0)
                })
            print(f"  WINDFOR chunk {chunk_start_str} to {chunk_end_str}: got {len(raw_items)} forecasts (Total: {len(all_forecasts)})")
            curr = next_chunk

        # Deduplicate by (publishTime, startTime)
        deduped = {}
        for item in all_forecasts:
            key = (item["publishTime"], item["startTime"])
            deduped[key] = item
        final_list = sorted(deduped.values(), key=lambda x: (x["publishTime"], x["startTime"]))
        print(f"Total unique WINDFOR records: {len(final_list)}")
        return final_list

    def sync_and_save(self) -> Dict[str, int]:
        """Fetch both datasets and persist to local JSON cache."""
        actuals = self.fetch_fuelhh_wind()
        forecasts = self.fetch_windfor()

        with open(self.fuelhh_file, "w", encoding="utf-8") as f:
            json.dump(actuals, f, indent=2)

        with open(self.windfor_file, "w", encoding="utf-8") as f:
            json.dump(forecasts, f, indent=2)

        print(f"Saved {len(actuals)} actuals to {self.fuelhh_file}")
        print(f"Saved {len(forecasts)} forecasts to {self.windfor_file}")
        return {"actuals_count": len(actuals), "forecasts_count": len(forecasts)}

    def load_cached_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load data from cache, or fetch if cache doesn't exist."""
        if not os.path.exists(self.fuelhh_file) or not os.path.exists(self.windfor_file):
            print("Cache missing, downloading from Elexon API...")
            self.sync_and_save()

        with open(self.fuelhh_file, "r", encoding="utf-8") as f:
            actuals = json.load(f)
        with open(self.windfor_file, "r", encoding="utf-8") as f:
            forecasts = json.load(f)

        return {"actuals": actuals, "forecasts": forecasts}

if __name__ == "__main__":
    client = ElexonClient(cache_dir="backend/data")
    res = client.sync_and_save()
    print("Sync complete:", res)
