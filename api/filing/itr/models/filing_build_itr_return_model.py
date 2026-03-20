"""Unified return model for ITR building - supports both ITR1 and ITR2."""
from pydantic import BaseModel

from domain.filing.itr.itr1.models.itr1_model import ITR1
from domain.filing.itr.itr2.models.itr2_model import ITR2
from domain.filing.models.filing_model import FilingModel


class FilingBuildItrReturnModel(BaseModel):
    """Unified return from ItrBuildingOrchestrator.build_itr().

    Exactly one of itr1/itr2 will be set based on the selected form type.
    """
    itr1: ITR1 | None = None
    itr2: ITR2 | None = None
    itr_type: str  # "ITR1" or "ITR2"
    filingSummary: FilingModel

    @property
    def itr_model_json(self) -> str:
        """Serialize whichever ITR model is populated."""
        if self.itr1 is not None:
            return self.itr1.model_dump_json()
        if self.itr2 is not None:
            return self.itr2.model_dump_json()
        raise ValueError("Neither itr1 nor itr2 is set")
