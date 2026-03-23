"""Response model for filing verify operations."""
from .api_base_model import ApiBaseModel


class VerifyFilingResponse(ApiBaseModel):
    """Response model for filing verify operation."""
    success: bool
    message: str
    filing_id: int
