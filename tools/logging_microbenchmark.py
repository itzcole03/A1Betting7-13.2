"""
Logging microbenchmark to quantify debug callsite overhead under different patterns.

Scenarios measured per iteration count:
- disabled/param: logger level=INFO, logger.debug("msg %s %d", a, b)
- disabled/fstring: logger level=INFO, logger.debug(f"msg {a} {b}")
- enabled/param: logger level=DEBUG, logger.debug("msg %s %d", a, b)
- enabled/fstring: logger level=DEBUG, logger.debug(f"msg {a} {b}")
- enabled/prebuilt: level=DEBUG, msg pre-built via .format(), then logger.debug(msg)

By default we attach a NullHandler to avoid I/O dominating results. Optionally use
--sink=stdout to gauge handler emission overhead.

Usage:
  python tools/logging_microbenchmark.py --iters 200000 --sink null
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from dataclasses import dataclass
from typing import Callable, List, Tuple


def make_logger(name: str, level: int, sink: str) -> logging.Logger:
    logger = logging.getLogger(name)
    # Ensure clean handlers per run
    for h in list(logger.handlers):
        logger.removeHandler(h)
    logger.propagate = False
    logger.setLevel(level)

    if sink == "stdout":
        stdout_handler: logging.Handler = logging.StreamHandler(stream=sys.stdout)
        stdout_handler.setLevel(level)
        fmt = logging.Formatter("%(message)s")
        stdout_handler.setFormatter(fmt)
        logger.addHandler(stdout_handler)
    else:
        # Null sink (discard output)
        class _NullHandler(logging.Handler):
            def emit(self, record: logging.LogRecord) -> None:
                pass

        null_handler: logging.Handler = _NullHandler(level=level)
        logger.addHandler(null_handler)

    return logger


@dataclass
class BenchResult:
    name: str
    iterations: int
    seconds: float

    @property
    def ns_per_call(self) -> float:
        return (self.seconds / self.iterations) * 1e9 if self.iterations else 0.0


def bench_fn(fn: Callable[[], None], iterations: int) -> float:
    start = time.perf_counter()
    for _ in range(iterations):
        fn()
    end = time.perf_counter()
    return end - start


def build_scenarios(iters: int, sink: str) -> List[Tuple[str, Callable[[], None]]]:
    scenarios: List[Tuple[str, Callable[[], None]]] = []

    # Inputs that could be used to simulate formatting cost
    a = "alpha"
    b = 42

    # Disabled level (INFO)
    l_dis = make_logger("bench.disabled", logging.INFO, sink)
    scenarios.append(
        (
            "disabled/param",
            lambda: l_dis.debug("hit %s %d", a, b),
        )
    )
    scenarios.append(
        (
            "disabled/fstring",
            lambda: l_dis.debug(f"hit {a} {b}"),
        )
    )

    # Enabled level (DEBUG)
    l_en = make_logger("bench.enabled", logging.DEBUG, sink)
    scenarios.append(
        (
            "enabled/param",
            lambda: l_en.debug("hit %s %d", a, b),
        )
    )
    scenarios.append(
        (
            "enabled/fstring",
            lambda: l_en.debug(f"hit {a} {b}"),
        )
    )

    def _prebuilt() -> None:
        msg = "hit {} {}".format(a, b)
        l_en.debug(msg)

    scenarios.append(("enabled/prebuilt", _prebuilt))

    return scenarios


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--iters", type=int, default=200_000)
    parser.add_argument(
        "--sink", choices=["null", "stdout"], default="null", help="Where to emit logs"
    )
    args = parser.parse_args()

    scenarios = build_scenarios(args.iters, args.sink)

    print("Logging microbenchmark")
    print(f"iterations: {args.iters}")
    print(f"sink: {args.sink}")
    print()

    results: List[BenchResult] = []
    for name, fn in scenarios:
        secs = bench_fn(fn, args.iters)
        results.append(BenchResult(name, args.iters, secs))

    # Pretty print
    max_name = max(len(r.name) for r in results)
    print(f"{'scenario'.ljust(max_name)}  seconds    ns/call")
    print("-" * (max_name + 22))
    for r in results:
        print(f"{r.name.ljust(max_name)}  {r.seconds:8.4f}  {r.ns_per_call:8.1f}")

    # Guidance
    print("\nNotes:")
    print(
        "- Parametrized logging (msg, *args) avoids formatting when disabled -> faster"
    )
    print("- f-strings/prebuilt strings pay formatting cost always, even if disabled")
    print(
        "- Null sink isolates formatting + logging call overhead; stdout includes I/O cost"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
