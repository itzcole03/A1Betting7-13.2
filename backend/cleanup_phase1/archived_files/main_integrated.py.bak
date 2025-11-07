"""Archived main_integrated - compact import-safe stub.

This file intentionally provides a minimal FastAPI application with a
health endpoint so tools that import `main_integrated` won't fail during
triage. Reintroduce the full legacy content only when ready.
"""

from fastapi import FastAPI

app = FastAPI(title="A1Betting main_integrated (stub)")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "main_integrated_stub"}


__all__ = ["app"]
