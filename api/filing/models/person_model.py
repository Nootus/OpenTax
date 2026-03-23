"""Personal details model."""
from datetime import date, datetime
from pydantic import EmailStr
from .api_base_model import ApiBaseModel


class PersonModel(ApiBaseModel):
    person_id: int | None = None
    user_id: int | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    father_name: str | None = None
    pan_number: str | None = None
    aadhaar_number: str | None = None
    date_of_birth: date | None = None
    residential_status: str | None = None
    email: EmailStr | None = None
    mobile_number: str | None = None
    country_code: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
