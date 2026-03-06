"""
Pytest конфигурация: сбор результатов точности и генерация Markdown-таблицы.
"""

import pytest
from datetime import datetime, timezone
from pathlib import Path

# Глобальный список результатов — заполняется из test_accuracy.py
_results: list[dict] = []


@pytest.fixture(scope="session")
def comparison_recorder() -> list[dict]:
    """Session-scoped фикстура: список для сбора сравнений Skyfield vs SwissEph."""
    return _results


def pytest_sessionfinish(session, exitstatus):
    """После всех тестов — записать Markdown-таблицу сравнения."""
    if not _results:
        return

    output_path = Path(__file__).parent / "comparison_table.md"
    with output_path.open("w", encoding="utf-8") as f:
        f.write("# AstroAI Accuracy: Skyfield vs Swiss Ephemeris\n\n")
        f.write(
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        )
        f.write("Tolerances: planets ±1.0°, ASC/MC ±0.5°\n\n")
        f.write(
            "| Date | Planet | Skyfield lon° | SwissEph lon° | Δ° | Pass |\n"
        )
        f.write(
            "|------|--------|:-------------:|:-------------:|:---:|:----:|\n"
        )
        for row in sorted(_results, key=lambda r: (r["date"], r["planet"])):
            status = "✅" if row["passed"] else "❌"
            f.write(
                f"| {row['date']} | {row['planet']} "
                f"| {row['skyfield']:.3f} | {row['swe']:.3f} "
                f"| {row['delta']:.3f} | {status} |\n"
            )

    passed = sum(1 for r in _results if r["passed"])
    total = len(_results)
    print(f"\n📊 Comparison table: {output_path}")
    print(f"   {passed}/{total} passed")
