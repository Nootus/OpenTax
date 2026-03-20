import logging

from fastapi import APIRouter

from filing.itr.itr1.models.itr1_model import ITR1
from filing.itr.itr_building_orchestrator import ItrBuildingOrchestrator
from filing.models.filing_model import FilingModel

logger = logging.getLogger(__name__)


class FilingController:
    """Controller class for filing operations."""

    def __init__(self) -> None:
        self.router = APIRouter()
        self._register_routes()

    def _register_routes(self) -> None:
        """Register all filing routes."""
        self.router.add_api_route(
            "/calculate_tax",
            self.calculate_tax,
            methods=["POST"],
            response_model=FilingModel,
        )

        self.router.add_api_route(
            "/get_itr1",
            self.get_itr1,
            methods=["POST"],
            response_model=ITR1,
        )

    async def calculate_tax(self, filing_model: FilingModel) -> FilingModel:
        """Calculate tax for both regimes and return the filing with tax_computation populated."""
        logger.info("calculate_tax called for filing_id=%s", filing_model.filing_id)
        orchestrator = ItrBuildingOrchestrator()
        result = await orchestrator.build_itr(filing_model)
        return result.filingSummary

    async def get_itr1(self, filing_model: FilingModel) -> ITR1:
        """Build the complete ITR-1 JSON from the filing data."""
        logger.info("get_itr1 called for filing_id=%s", filing_model.filing_id)
        orchestrator = ItrBuildingOrchestrator()
        result = await orchestrator.build_itr(filing_model)
        return result.itr1