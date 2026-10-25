"""
Configuration settings for WindIQ — UK Renewable Energy Forecast Analytics.
Handles environment variables, default paths, and market parameters.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "WindIQ"
    environment: str = os.getenv("ENVIRONMENT", "development")
    api_prefix: str = "/api"
    
    # Elexon BMRS API Endpoints
    elexon_bmrs_base_url: str = os.getenv(
        "ELEXON_BMRS_BASE_URL", 
        "https://data.elexon.co.uk/bmrs/api/v1"
    )
    elexon_fuelhh_url: str = os.getenv(
        "ELEXON_FUELHH_URL",
        "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
    )
    elexon_windfor_url: str = os.getenv(
        "ELEXON_WINDFOR_URL",
        "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
    )

    # Market Parameters
    default_market: str = "EPEX SPOT / Nord Pool GB"
    default_start_date: str = "2026-01-01"
    default_end_date: str = "2026-01-31"
    default_gate_closure_cutoff: str = "11:00"  # 11:00 UTC Day D-1
    timezone: str = "UTC (GMT)"

    # Base Data Directory
    data_dir: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

settings = Settings()
