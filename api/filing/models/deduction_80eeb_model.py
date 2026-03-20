from .deduction_80e_model import Deduction80EModel


class Deduction80EEBModel(Deduction80EModel):
    vehicle_make_model: str | None = None
    vehicle_registration_number: str | None = None

    @property
    def itr_vehicle_reg_no(self) -> str:
        return ((self.vehicle_registration_number or "").strip() or "NA")[:50]
