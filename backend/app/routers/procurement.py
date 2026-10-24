from fastapi import APIRouter, Query, Depends
from typing import Optional

from app.models.schemas import (
    ProcurementPlanRequest,
    ProcurementPlanResponse
)
from app.services.data_processor import DataProcessor
from app.services.procurement_service import ProcurementService

router = APIRouter(prefix="/api/procurement", tags=["Procurement Optimization"])

def get_processor() -> DataProcessor:
    from app.main import processor_instance
    return processor_instance

@router.post("/plan", response_model=ProcurementPlanResponse)
def calculate_procurement_plan(
    req: ProcurementPlanRequest,
    processor: DataProcessor = Depends(get_processor)
):
    """
    Computes recommended day-ahead thermal power procurement and quantified reserve buffer
    based on consumer demand, day-ahead wind forecast, and historical error distributions.
    """
    service = ProcurementService(processor)
    return service.calculate_procurement_plan(req)

@router.get("/default-plan", response_model=ProcurementPlanResponse)
def get_default_plan(
    deliveryDate: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    demandMW: float = Query(28000.0, description="Nominal peak demand MW"),
    confidenceLevel: float = Query(0.90, description="Risk tolerance (0.80 to 0.99)"),
    gateClosureTime: str = Query("11:00", description="Gate closure cutoff time (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Get a ready-to-use procurement plan for a given delivery date with default parameters.
    """
    req = ProcurementPlanRequest(
        deliveryDate=deliveryDate,
        demandMW=demandMW,
        confidenceLevel=confidenceLevel,
        gateClosureCutoff=gateClosureTime
    )
    service = ProcurementService(processor)
    return service.calculate_procurement_plan(req)
