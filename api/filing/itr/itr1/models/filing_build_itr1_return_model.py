


from pydantic import BaseModel

from filing.itr.itr1.models.itr1_model import ITR1
from filing.models.filing_model import FilingModel


class FilingBuildItr1ReturnModel(BaseModel):
    itr1: ITR1
    filingSummary: FilingModel
