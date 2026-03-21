import logging

from fastapi import APIRouter

from filing.itr.itr_building_orchestrator import ItrBuildingOrchestrator
from filing.itr.validations.models.validation import ValidationResponse
from filing.models.filing_model import FilingModel
from filing.models.master_data_model import MasterDataModel
from filing.utils.master_data_service import MasterDataService

logger = logging.getLogger(__name__)


class FilingController:
    """Controller class for filing operations."""

    def __init__(self) -> None:
        self.router = APIRouter()
        self._register_routes()

    def _register_routes(self) -> None:
        """Register all filing routes."""
        self.router.add_api_route(
            "/master_data",
            self.get_master_data,
            methods=["GET"],
            response_model=MasterDataModel,
        )

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
            response_model=ValidationResponse,
        )

    async def calculate_tax(self, filing_model: FilingModel) -> FilingModel:
        """Calculate tax for both regimes and return the filing with tax_computation populated."""
        logger.info("calculate_tax called for filing_id=%s", filing_model.filing_id)
        orchestrator = ItrBuildingOrchestrator()
        result = await orchestrator.build_itr(filing_model)
        return result.filingSummary

    def get_master_data(self) -> MasterDataModel:
        """Return all master data (dropdown options) in one call."""
        return MasterDataService().get_all_master_data()

    async def get_itr1(self, filing_model: FilingModel) -> ValidationResponse:
        """Build the complete ITR-1 JSON from the filing data."""
        logger.info("get_itr1 called for filing_id=%s", filing_model.filing_id)
        orchestrator = ItrBuildingOrchestrator()
        result = await orchestrator.build_itr(filing_model)
        errors = result.filingSummary.user_validation_errors or []
        return ValidationResponse(
            success=len(errors) == 0,
            validation_errors=errors,
            total_errors=len(errors),
            itr_summary=result.itr1,
        )