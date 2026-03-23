from pydantic import Field
from .api_base_model import ApiBaseModel


class DeductionAmount(ApiBaseModel):
    claimed: int = Field(default=0)
    max_allowed: int = Field(default=0)
    allowed: int = Field(default=0)
