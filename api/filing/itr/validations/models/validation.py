"""Shared models for filing validation responses.

Kept in models/ to avoid circular imports between controllers and services.
"""

from __future__ import annotations

from typing import List, Optional, Dict, Any

from .api_base_model import ApiBaseModel

from domain.filing.itr.itr1.models.itr1_model import ITR1
from domain.filing.itr.itr2.models.itr2_model import ITR2


class ValidationError(ApiBaseModel):
    """Represents a single validation error."""

    field: str
    message: str
    entity_id: Optional[int] = None


class ValidationResponse(ApiBaseModel):
    """Response model for filing validation."""

    success: bool
    validation_errors: List[ValidationError]
    total_errors: int
    arn_number: Optional[str] = None
    itr_summary: Optional[ITR1 | ITR2] = None
    master_data: Optional[Dict[str, Any]] = None
    client_not_registered: Optional[bool] = None
    itr_form: Optional[str] = None  # e.g., "ITR-1", "ITR-2"
