from __future__ import annotations

import re
from datetime import date, datetime
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple, Type, cast


JsonDict = Dict[str, Any]


SUM_REGEX = re.compile(r"sum\(([^)]+)\)")
DEFAULT_REGEX = re.compile(r"default\((.+)\)")


# ==================================================
# PATH HELPERS
# ==================================================

def _read(obj: Any, key: str) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        d: Dict[str, Any] = cast(Dict[str, Any], obj)
        return d.get(key)
    return getattr(obj, key, None)


def _get(obj: Any, path: str) -> Any:
    cur: Any = obj
    for part in path.split("."):
        cur = _read(cur, part)
    return cur


def _set(obj: JsonDict, path: str, value: Any) -> None:
    parts = path.split(".")
    cur: JsonDict = obj

    for p in parts[:-1]:
        nxt_any = cur.get(p)
        if isinstance(nxt_any, dict):
            nxt: JsonDict = cast(JsonDict, nxt_any)
        else:
            nxt = {}
            cur[p] = nxt
        cur = nxt

    cur[parts[-1]] = value


def _normalize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def _split_array(path: str) -> Tuple[str, str]:
    root, rest = path.split("[]", 1)
    return root.strip("."), rest.lstrip(".")


def _sum_numeric(items: Optional[List[Any]], field: str) -> float:
    total = 0.0
    if not items:
        return total

    for item in items:
        v = _get(item, field)
        total += float(v) if v is not None else 0.0

    return total


def _parse_default_literal(raw: str) -> Any:
    text = raw.strip()

    if len(text) >= 2:
        if (text.startswith("\"") and text.endswith("\"")) or (text.startswith("'") and text.endswith("'")):
            return text[1:-1]

    if re.fullmatch(r"-?\d+", text):
        return int(text)

    if re.fullmatch(r"-?\d+\.\d+", text):
        return float(text)

    # Fallback: treat as raw string
    return text


# ==================================================
# RULE MODEL
# ==================================================

@dataclass(frozen=True)
class MappingRule:
    src: str
    dst: str
    forward: bool
    reverse: bool


def _parse_rules(lines: Sequence[str]) -> List[MappingRule]:
    rules: List[MappingRule] = []

    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        if "<=>" in line:
            a, b = line.split("<=>", 1)
            rules.append(MappingRule(a.strip(), b.strip(), True, True))

        elif "=>" in line:
            a, b = line.split("=>", 1)
            rules.append(MappingRule(a.strip(), b.strip(), True, False))

        elif "<=" in line:
            b, a = line.split("<=", 1)
            rules.append(MappingRule(a.strip(), b.strip(), False, True))

        else:
            raise ValueError(f"Invalid rule: {line}")

    return rules


# ==================================================
# AUTOMAPPER
# ==================================================

class AutoMapper:

    def __init__(self, *, rules: Sequence[str], ignore_missing: bool = True):
        self._rules: List[MappingRule] = _parse_rules(rules)
        self._ignore_missing = ignore_missing

    # ------------------------------------------------
    # FORWARD
    # ------------------------------------------------

    def map(self, *, source: Any, target_type: Type[Any]) -> Any:

        payload: JsonDict = {}

        # ---------- MAP SUM AGGREGATIONS ----------
        for r in self._rules:
            if not r.forward:
                continue

            src = r.src.strip()
            if not src.startswith("sum("):
                continue

            m = SUM_REGEX.fullmatch(src)
            if not m:
                if self._ignore_missing:
                    continue
                raise ValueError(f"Invalid sum() expression: {r.src}")

            inner = m.group(1).strip()
            if "[]" not in inner:
                if self._ignore_missing:
                    continue
                raise ValueError(f"sum() requires array syntax []: {r.src}")

            src_root, src_field = _split_array(inner)

            items_any: Any
            try:
                items_any = _get(source, src_root)
            except Exception:
                if self._ignore_missing:
                    continue
                raise

            items_iter: Optional[Iterable[Any]] = cast(Optional[Iterable[Any]], items_any)

            items_list: Optional[List[Any]] = None
            if isinstance(items_iter, list):
                items_list = items_iter

            total = _sum_numeric(items_list, src_field)
            _set(payload, r.dst, int(total))

        # ---------- GROUP ARRAY RULES ----------
        array_groups: Dict[Tuple[str, str], List[Tuple[str, str]]] = {}

        for r in self._rules:
            if not r.forward:
                continue

            src_stripped = r.src.strip()
            if src_stripped.startswith("sum(") or src_stripped.startswith("default("):
                continue

            if "[]" in r.src:
                if "[]" not in r.dst:
                    if self._ignore_missing:
                        continue
                    raise ValueError(f"Array rule requires [] in destination: {r.src} => {r.dst}")

                sr, sf = _split_array(r.src)
                dr, df = _split_array(r.dst)
                array_groups.setdefault((sr, dr), []).append((sf, df))

        # ---------- MAP ARRAYS ----------
        for (src_root, dst_root), fields in array_groups.items():

            items = _get(source, src_root)

            if not isinstance(items, Iterable):
                continue

            result: List[JsonDict] = []

            for item in cast(Iterable[Any], items):
                row: JsonDict = {}
                for sf, df in fields:
                    row[df] = _normalize_value(_read(item, sf))
                result.append(row)

            _set(payload, dst_root, result)

        # ---------- MAP NORMAL FIELDS ----------
        for r in self._rules:
            src_stripped = r.src.strip()
            if not r.forward or "[]" in r.src or src_stripped.startswith("sum(") or src_stripped.startswith("default("):
                continue

            try:
                val = _get(source, r.src)
            except Exception:
                if self._ignore_missing:
                    continue
                raise

            _set(payload, r.dst, val)
            # Normalize common scalar types (e.g., date) for JSON/Pydantic schemas
            _set(payload, r.dst, _normalize_value(val))

        # ---------- APPLY DEFAULTS (AFTER ALL MAPPING) ----------
        for r in self._rules:
            if not r.forward:
                continue

            src = r.src.strip()
            if not src.startswith("default("):
                continue

            m = DEFAULT_REGEX.fullmatch(src)
            if not m:
                if self._ignore_missing:
                    continue
                raise ValueError(f"Invalid default() expression: {r.src}")

            inner = m.group(1).strip()
            default_value = _parse_default_literal(inner)

            current = _get(payload, r.dst)
            if current is not None:
                continue

            _set(payload, r.dst, default_value)

        # Pydantic support
        if hasattr(target_type, "model_validate"):
            return target_type.model_validate(payload)

        # Dynamic constructor (safe, but pylance can't prove)
        return payload if target_type is dict else target_type(**payload)  # type: ignore

    # ------------------------------------------------
    # REVERSE
    # ------------------------------------------------

    def reverse_map(self, *, source: Any, target_type: Type[Any]) -> Any:

        payload: JsonDict = {}

        for r in self._rules:
            if not r.reverse or "[]" in r.dst:
                continue

            try:
                val = _get(source, r.dst)
            except Exception:
                if self._ignore_missing:
                    continue
                raise

            _set(payload, r.src, val)

        if hasattr(target_type, "model_validate"):
            return target_type.model_validate(payload)

        return payload if target_type is dict else target_type(**payload)  # type: ignore
