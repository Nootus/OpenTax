


from pydantic import BaseModel

from domain.filing.itr.itr1.models.itr1_model import ITR1
from domain.filing.models.filing_model import FilingModel


class FilingBuildItr1ReturnModel(BaseModel):
    itr1: ITR1
    filingSummary: FilingModel
