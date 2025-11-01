import pytest
from sqlalchemy import select

from backend.models.bookmark import BookmarkORM
from backend.services.query_optimizer import query_optimizer


def compile_sql(query):
    # Helper to produce a lowercase SQL string for assertions
    if hasattr(query, "compile"):
        try:
            return str(query.compile(compile_kwargs={"literal_binds": True})).lower()
        except Exception:
            return str(query).lower()
    return str(query).lower()


@pytest.mark.asyncio
async def test_no_pagination_when_flag_disabled():
    # Ensure flag is disabled
    query_optimizer.settings.performance.enable_safe_query_pagination = False
    q = select(BookmarkORM)
    sql_before = compile_sql(q)

    analysis = query_optimizer.analyzer.analyze_query(sql_before)
    optimized = await query_optimizer._apply_optimizations(q, analysis)
    sql_after = compile_sql(optimized)

    # Should not inject limit when disabled
    assert sql_after == sql_before or " limit " not in sql_after


@pytest.mark.asyncio
async def test_pagination_injected_for_select_without_limit_sqlalchemy():
    query_optimizer.settings.performance.enable_safe_query_pagination = True
    query_optimizer.settings.performance.default_select_limit = 10
    q = select(BookmarkORM)
    sql_before = compile_sql(q)
    assert " limit " not in sql_before

    analysis = query_optimizer.analyzer.analyze_query(sql_before)
    optimized = await query_optimizer._apply_optimizations(q, analysis)
    sql_after = compile_sql(optimized)

    assert " limit " in sql_after and (
        " limit 10" in sql_after or " limit :" in sql_after
    )


@pytest.mark.asyncio
async def test_pagination_injected_for_raw_sql():
    query_optimizer.settings.performance.enable_safe_query_pagination = True
    query_optimizer.settings.performance.default_select_limit = 25

    raw = "SELECT * FROM users"
    analysis = query_optimizer.analyzer.analyze_query(raw)
    optimized = await query_optimizer._apply_optimizations(raw, analysis)

    assert optimized.lower().endswith(" limit 25"), optimized
