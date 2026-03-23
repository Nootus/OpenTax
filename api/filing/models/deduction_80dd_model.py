from .api_base_model import ApiBaseModel


class Deduction80DDModel(ApiBaseModel):
    deduction_id: int | None = None
    filing_id: int
    dependant_name: str | None = None
    disability_type: str | None = None  # "Disabled" or "Severely Disabled"
    nature_of_disability: str | None = None
    relation_to_dependant: str | None = None
    dependant_pan: str | None = None
    expenditure_incurred: float
    form_101a_filing_date: str | None = None
    form_101a_ack_no: str | None = None
    udid_no: str | None = None

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
    def itr_dependent_type(self) -> str:
        r = (self.relation_to_dependant or "").lower()
        m = {"spouse": "1", "son": "2", "daughter": "3", "father": "4", "mother": "5", "brother": "6", "sister": "7"}
        return m.get(r, "1")

    @property
    def itr_dependent_pan(self) -> str:
        return (self.dependant_pan or "NA").strip() or "NA"

    @property
    def itr_form10ia_ack_num(self) -> str:
        return ((self.form_101a_ack_no or "").strip() or "")[:15]

    @property
    def itr_udid_num(self) -> str:
        return ((self.udid_no or "").strip() or "")[:18]
# Deduction80DDModel
