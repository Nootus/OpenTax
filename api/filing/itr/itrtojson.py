from __future__ import annotations
from typing import Any, Dict, Tuple, Union

from filing.itr.auto_mapper import AutoMapper
from filing.itr.itr1.models.itr1_model import ITR1


class ItrJsonMapper:
    """
    Handles:
      - JSON (dict) -> ITR1
      - ITR1 -> JSON (dict)

    JSON format expected:
    {
        "ITR": {
            "ITR1": { ... }
        }
    }
    """

    # --------------------------------------------------
    # Rules (ITR1 <-> JSON core is STRUCTURAL, same shape)
    # --------------------------------------------------
    RULES: list[str] = []

    _mapper: AutoMapper = AutoMapper(
        rules=RULES,
        ignore_missing=True,
    )

    # --------------------------------------------------
    # JSON -> ITR1
    # --------------------------------------------------
    @classmethod
    def json_to_itr1(cls, payload: Dict[str, Any]) -> ITR1:
        """
        Convert JSON payload to ITR1 model
        """

        itr1_core = payload["ITR"]["ITR1"]

        # Direct model validation (no mapping needed)
        if hasattr(ITR1, "model_validate"):
            return ITR1.model_validate(itr1_core)

        return ITR1(**itr1_core)

    # --------------------------------------------------
    # ITR1 -> JSON
    # --------------------------------------------------
    @classmethod
    def itr1_to_json(cls, itr1: ITR1) -> Dict[str, Any]:
        """
        Convert ITR1 model back to JSON payload
        """

        # Prefer Pydantic v2 API; fall back to v1 without referencing deprecated attributes directly.
        dump_fn = getattr(itr1, "model_dump", None)
        if callable(dump_fn):
            # Use mode="json" to ensure enums are serialized to their values
            itr1_dict = dump_fn(by_alias=True, exclude_none=True, mode="json")
        else:
            itr1_dict = getattr(itr1, "dict")(by_alias=True, exclude_none=True)

        return {
            "ITR": {
                "ITR1": itr1_dict
            }
        }

    # --------------------------------------------------
    # ITR1 -> JSON  (+ form_name, form_code)
    # --------------------------------------------------
    @classmethod
    def itr_to_json(cls, itr: Union[ITR1, None]) -> Tuple[Dict[str, Any], str, str]:
        """
        Convert ITR1 model to JSON payload.

        Returns:
            (json_dict, form_name, form_code)
            e.g. ({"ITR": {"ITR1": {...}}}, "ITR-1", "1")
        """
        # Default: treat as ITR1 (construct empty shell if None)
        itr1 = itr if isinstance(itr, ITR1) else ITR1.model_construct()
        return cls.itr1_to_json(itr1), "ITR-1", "1"
