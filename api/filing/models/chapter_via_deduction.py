from .deduction_amount import DeductionAmount
from .api_base_model import ApiBaseModel


class ChapterVIADeductions(ApiBaseModel):
    section_80c: DeductionAmount = DeductionAmount()
    section_80ccc: DeductionAmount = DeductionAmount()
    section_80ccd1: DeductionAmount = DeductionAmount()
    section_80ccd1b: DeductionAmount = DeductionAmount()
    section_80ccd2: DeductionAmount = DeductionAmount()

    section_80d: DeductionAmount = DeductionAmount()
    section_80dd: DeductionAmount = DeductionAmount()
    section_80ddb: DeductionAmount = DeductionAmount()
    section_80e: DeductionAmount = DeductionAmount()

    section_80ee: DeductionAmount = DeductionAmount()
    section_80eea: DeductionAmount = DeductionAmount()
    section_80eeb: DeductionAmount = DeductionAmount()

    section_80tta: DeductionAmount = DeductionAmount()
    section_80ttb: DeductionAmount = DeductionAmount()

    section_80g: DeductionAmount = DeductionAmount()
    section_80gg: DeductionAmount = DeductionAmount()
    section_80gga: DeductionAmount = DeductionAmount()
    section_80ggc: DeductionAmount = DeductionAmount()

    section_80u: DeductionAmount = DeductionAmount()

    section_80cch: DeductionAmount = DeductionAmount()
    section_80qqb: DeductionAmount = DeductionAmount()
    section_80rrb: DeductionAmount = DeductionAmount()
