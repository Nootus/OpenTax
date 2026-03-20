from datetime import date


def compute_age(dob: date, assessment_year: str) -> int:
    """Return age as of 31-March of the assessment year end.

    Args:
        dob: Date of birth.
        assessment_year: Assessment year string, e.g. "2026-27".
    """
    ay_raw = (assessment_year or "").strip()

    today = date.today()
    current_fy_end_year = today.year if today.month <= 3 else today.year + 1

    fy_end_year: int | None = None
    parts = ay_raw.split("-") if ay_raw else []
    if len(parts) >= 2 and parts[1].strip():
        tail = parts[1].strip()
        try:
            fy_end_year = 2000 + int(tail) if len(tail) <= 2 else int(tail)
        except ValueError:
            fy_end_year = None
    if fy_end_year is None and parts and parts[0].strip():
        try:
            head = int(parts[0].strip())
            if 1900 <= head <= 3000:
                fy_end_year = head + 1
        except ValueError:
            fy_end_year = None
    if fy_end_year is None:
        fy_end_year = current_fy_end_year

    ay_end = date(fy_end_year, 3, 31)
    age = ay_end.year - dob.year
    if (dob.month, dob.day) > (ay_end.month, ay_end.day):
        age -= 1
    return age
