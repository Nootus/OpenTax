"""Response model for filing reset operations."""
from typing import Optional
from .api_base_model import ApiBaseModel
from .filing_model import FilingModel


class ResetFilingResponse(ApiBaseModel):
    """Response model for reset filing operation."""
    new_filing_id: int
    archived_filing_id: int
    person_id: int
    assessment_year: str
    filing_summary: Optional[FilingModel] = None
