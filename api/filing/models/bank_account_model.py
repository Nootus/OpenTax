from .api_base_model import ApiBaseModel


class BankAccountModel(ApiBaseModel):
    bank_account_id: int | None = None
    person_id: int | None = None
    account_number: str
    ifsc_code: str
    bank_name: str
    account_type: str
    is_primary: bool = False
