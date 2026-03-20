from .api_base_model import ApiBaseModel


class BankAccountModel(ApiBaseModel):
    bank_account_id: int | None = None
    person_id: int | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    bank_name: str | None = None
    account_type: str | None = None
    is_primary: bool = False
