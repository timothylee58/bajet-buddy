from __future__ import annotations


STANDARD_WORK_HOURS_PER_MONTH = 176.0  # 22 days × 8h


def compute_real_hourly_rate(
    monthly_salary: float | None,
    commute_hours_per_day: float | None = 0.0,
    overtime_hours_per_week: float | None = 0.0,
) -> float:
    """
    Real hourly rate = salary / (standard + commute + overtime hours).

    Standard: 22 working days × 8h = 176h/month
    Commute:  commute_hours_per_day × 22 days
    Overtime: overtime_hours_per_week × 4.33 weeks
    """
    salary = monthly_salary or 0.0
    commute_hours = (commute_hours_per_day or 0.0) * 22
    overtime_hours = (overtime_hours_per_week or 0.0) * 4.33
    total_hours = STANDARD_WORK_HOURS_PER_MONTH + commute_hours + overtime_hours
    return round(salary / max(total_hours, 1.0), 2)


def amount_to_life_hours(amount: float, real_hourly_rate: float) -> float:
    """Convert RM amount to hours of working life."""
    return round(amount / max(real_hourly_rate, 0.01), 1)


def format_life_hours_my(hours: float) -> str:
    """Format hours into Malaysian-friendly Malay string."""
    if hours >= 8:
        days = round(hours / 8, 1)
        return f"{days} hari kerja"
    if hours < 1:
        mins = round(hours * 60)
        return f"{mins} minit kerja"
    return f"{hours} jam kerja"
