from datetime import UTC, date, datetime, time


def parse_month(value: str | None) -> date:
    """Parse a YYYY-MM string into the first day of that month."""
    if not value:
        return datetime.now(UTC).date().replace(day=1)
    try:
        return datetime.strptime(value, "%Y-%m").date().replace(day=1)
    except ValueError as exc:
        raise ValueError("month must use YYYY-MM format") from exc


def month_bounds(month: date) -> tuple[datetime, datetime]:
    """Return inclusive-start, exclusive-end UTC datetimes for a month."""
    start = datetime.combine(month, time.min, tzinfo=UTC)
    if month.month == 12:
        next_month = date(month.year + 1, 1, 1)
    else:
        next_month = date(month.year, month.month + 1, 1)
    return start, datetime.combine(next_month, time.min, tzinfo=UTC)


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def shift_month(value: date, delta: int) -> date:
    index = value.year * 12 + (value.month - 1) + delta
    return date(index // 12, index % 12 + 1, 1)
