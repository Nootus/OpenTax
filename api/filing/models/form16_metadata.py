"""Form16 Metadata Model."""
from .api_base_model import ApiBaseModel


class Form16Metadata(ApiBaseModel):
    """Form16 certificate metadata (one per employer)."""
    filing_id: int | None = None
    form16_upload_id: int | None = None
    certificate_number: str | None = None
    processing_date: str | None = None
    assessment_year: str | None = None
    cit_name: str | None = None
    cit_address_line1: str | None = None
    cit_address_line2: str | None = None
    part_a_total_tax_deposited: float = 0.0
    verification_authorized_person: str | None = None
    verification_father_name: str | None = None
    verification_designation: str | None = None
    verification_place: str | None = None
    verification_date: str | None = None
    verification_full_name: str | None = None
