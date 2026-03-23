from .api_base_model import ApiBaseModel
from .deduction_80cch_model import Deduction80CCHModel
from .deduction_80gg_model import Deduction80GGModel
from .deduction_80tta_model import Deduction80TTAModel
from .deduction_80ttb_model import Deduction80TTBModel

class OtherDeductionModel(ApiBaseModel):
    filing_id: int
    deduction_80_cch: Deduction80CCHModel
    deduction_80_gg: Deduction80GGModel
    deduction_80_tta: Deduction80TTAModel
    deduction_80_ttb: Deduction80TTBModel
