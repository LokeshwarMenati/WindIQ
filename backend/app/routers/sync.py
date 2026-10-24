from fastapi import APIRouter, BackgroundTasks, Depends
import os
import json
from datetime import datetime

from app.services.data_processor import DataProcessor
from app.services.elexon_client import ElexonClient

router = APIRouter(prefix="/api/sync", tags=["Data Sync & Provenance"])

def get_processor() -> DataProcessor:
    from app.main import processor_instance
    return processor_instance

@router.get("/status")
def get_sync_status(processor: DataProcessor = Depends(get_processor)):
    """
    Returns the status of the local Elexon cache, record counts, and last modified times.
    """
    processor.ensure_loaded()
    fuelhh_path = processor.client.fuelhh_file
    windfor_path = processor.client.windfor_file

    def get_file_info(p):
        if os.path.exists(p):
            stat = os.stat(p)
            return {
                "exists": True,
                "sizeBytes": stat.st_size,
                "sizeMB": round(stat.st_size / (1024 * 1024), 2),
                "lastModified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            }
        return {"exists": False}

    return {
        "status": "operational",
        "datasetCoverage": "January 2026",
        "actuals": {
            "recordCount": len(processor.actuals),
            "file": get_file_info(fuelhh_path)
        },
        "forecasts": {
            "recordCount": len(processor.forecasts),
            "file": get_file_info(windfor_path)
        },
        "availableDeliveryDates": len(processor.get_available_dates())
    }

@router.post("/refresh")
def refresh_cache(background_tasks: BackgroundTasks, processor: DataProcessor = Depends(get_processor)):
    """
    Triggers a live re-download of January 2026 data from Elexon BMRS in the background.
    """
    def do_sync():
        client = ElexonClient(cache_dir=processor.data_dir)
        client.sync_and_save()
        processor.load_data()

    background_tasks.add_task(do_sync)
    return {"message": "Cache refresh initiated in background"}
