from .api_base_model import ApiBaseModel


class Deduction80UModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    disability_type: str | None = None  # "Disabled" or "Severely Disabled"
    expenditure_incurred: float
    form_101a_ack_no: str | None = None
    udid_no: str | None = None
    nature_of_disability: str | None = None  # for TypeOfDisability mapping

    @property
    def itr_nature_of_disability(self) -> str:
        d = (self.disability_type or "").lower()
        return "2" if "severe" in d else "1"

    @property
    def itr_type_of_disability(self) -> str:
        n = (self.nature_of_disability or "").lower()
        return "1" if any(x in n for x in ("autism", "cerebral", "multiple")) else "2"

    @property
    def itr_deduction_amount(self) -> int:
        return int(self.expenditure_incurred or 0)

    @property
    def itr_form10ia_ack_num(self) -> str:
        return ((self.form_101a_ack_no or "").strip() or "")[:15]

    @property
    def itr_udid_num(self) -> str:
        return ((self.udid_no or "").strip() or "")[:18]
# Deduction80UModel

