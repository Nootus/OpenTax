from .api_base_model import ApiBaseModel


class Deduction80DHealthInsuranceModel(ApiBaseModel):
    health_id: int | None = None
    deduction_id: int | None = None
    filing_id: int
    taken_for: str  # "Self" or "Self & Family" or "Parents"
    includes_senior_citizen: bool = False
    policy_number: str | None = None
    health_insurance_premium: float
    insurer_name: str | None = None

    @property
    def itr_insurer_name(self) -> str:
        return ((self.insurer_name or "NA").strip() or "NA")[:125]

    @property
    def itr_policy_no(self) -> str:
        return ((self.policy_number or "").strip() or "0")[:75]

    @property
    def itr_health_ins_amt(self) -> int:
        return int(self.health_insurance_premium or 0)


class Deduction80DPreventiveCheckupModel(ApiBaseModel):
    checkup_id: int | None = None
    deduction_id: int | None = None
    filing_id: int
    taken_for: str  # "Self" or "Self & Family" or "Parents"
    includes_senior_citizen: bool = False
    checkup_amount: float


class Deduction80DMedicalExpenditureModel(ApiBaseModel):
    expenditure_id: int | None = None
    deduction_id: int | None = None
    filing_id: int
    taken_for: str  # "Self" or "Self & Family" or "Parents"
    includes_senior_citizen: bool = False
    expenditure_amount: float


class Deduction80DModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    health_insurance: list[Deduction80DHealthInsuranceModel] | None = []
    preventive_checkup: list[Deduction80DPreventiveCheckupModel] | None = []
    medical_expenditure: list[Deduction80DMedicalExpenditureModel] | None = []
# Deduction80DModel
