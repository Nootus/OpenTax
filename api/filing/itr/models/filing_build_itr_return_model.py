"""Return model for ITR1 building."""
from pydantic import BaseModel

from filing.itr.itr1.models.itr1_model import ITR1
from filing.models.filing_model import FilingModel


class FilingBuildItrReturnModel(BaseModel):
    """Return from ItrBuildingOrchestrator.build_itr()."""
    itr1: ITR1
    itr_type: str = "ITR1"
    filingSummary: FilingModel

    @property
    def itr_model_json(self) -> str:
        """Serialize the ITR1 model."""
        return self.itr1.model_dump_json()
