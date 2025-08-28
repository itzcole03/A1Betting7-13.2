
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Debt Calendar Planner (full-month pages, legend wrapping, smart scheduler, payday-aware, accessibility & QoL)
"""

from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass, field, asdict
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple

import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, filedialog

try:
    from tkcalendar import DateEntry
except Exception:
    raise SystemExit("tkcalendar is required. Install it with:\n\n    pip install tkcalendar\n")

APP_TITLE = "Debt Calendar Planner"
SAVE_FILE = "budget_state.json"

PALETTE = [
    "#FFB300", "#00A6ED", "#114B5F", "#F46036", "#9B5DE5",
    "#00C2A8", "#FF6B6B", "#4D908E", "#2E86AB", "#F25F5C",
]


# -------------------- Data model --------------------

@dataclass
class Payment:
    when: str
    amount: float
    note: str = ""


@dataclass
class Bill:
    name: str
    total: float
    due: str
    priority: int
    color: str
    payments: List[Payment] = field(default_factory=list)

    @property
    def due_date(self) -> date:
        return datetime.strptime(self.due, "%Y-%m-%d").date()

    @property
    def paid_amount(self) -> float:
        # Only sum positive payments; "missed" entries are stored as 0
        return round(sum(p.amount for p in self.payments if isinstance(p, Payment) and p.amount > 0), 2)

    @property
    def remaining(self) -> float:
        return max(round(self.total - self.paid_amount, 2), 0.0)

    def add_payment(self, d: date, amount: float, note: str) -> None:
        self.payments.append(Payment(d.isoformat(), float(amount), note))

    def revert_idx(self, idx: int) -> Optional[Payment]:
        if 0 <= idx < len(self.payments):
            return self.payments.pop(idx)
        return None


@dataclass
class Plan:
    start: str
    end: str
    schedule: Dict[str, List[Tuple[str, float]]] = field(default_factory=dict)
    income: Dict[str, float] = field(default_factory=dict)  # {iso_date: amount}

    @property
    def start_date(self) -> date:
        return datetime.strptime(self.start, "%Y-%m-%d").date()

    @property
    def end_date(self) -> date:
        return datetime.strptime(self.end, "%Y-%m-%d").date()

    def days(self) -> List[date]:
        cur, out = self.start_date, []
        while cur <= self.end_date:
            out.append(cur)
            cur += timedelta(days=1)
        return out


# -------------------- Persistence --------------------

def _bill_from_dict(bd: dict) -> Bill:
    """
    Create a Bill from a dict, converting 'payments' to Payment objects
    if they were saved as plain dicts.
    """
    payments_raw = bd.get("payments", [])
    payments: List[Payment] = []
    for p in payments_raw:
        if isinstance(p, Payment):
            payments.append(p)
        elif isinstance(p, dict):
            # tolerate missing keys with defaults
            payments.append(Payment(
                when=p.get("when") or p.get("date") or date.today().isoformat(),
                amount=float(p.get("amount", 0.0)),
                note=p.get("note", "")
            ))
    return Bill(
        name=bd.get("name", "Bill"),
        total=float(bd.get("total", 0.0)),
        due=bd.get("due", date.today().isoformat()),
        priority=int(bd.get("priority", 3)),
        color=bd.get("color", ""),
        payments=payments
    )


def load_state() -> Tuple[List[Bill], Optional[Plan], bool]:
    if not os.path.exists(SAVE_FILE):
        return [], None, True
    try:
        with open(SAVE_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        # Convert each bill dict properly (fixes 'dict' has no attribute 'amount')
        bills = [_bill_from_dict(b) for b in raw.get("bills", [])]
        plan = None
        if raw.get("plan"):
            pd = raw["plan"]
            plan = Plan(
                start=pd["start"],
                end=pd["end"],
                schedule=pd.get("schedule", {}),
                income=pd.get("income", {}),
            )
        auto = bool(raw.get("auto_calc", True))
        return bills, plan, auto
    except Exception:
        return [], None, True


def save_state(bills: List[Bill], plan: Optional[Plan], auto_calc: bool) -> None:
    data = {
        "bills": [
            {
                **{k: v for k, v in asdict(b).items() if k != "payments"},
                "payments": [asdict(p) for p in b.payments],
            }
            for b in bills
        ],
        "plan": asdict(plan) if plan else None,
        "auto_calc": bool(auto_calc),
    }
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# -------------------- Tooltip --------------------

class Tooltip:
    def __init__(self, widget: tk.Widget, text: str = "", delay_ms: int = 350):
        self.widget = widget
        self.text = text
        self.delay = delay_ms
        self._id = None
        self._tip = None
        widget.bind("<Enter>", self._schedule)
        widget.bind("<Leave>", self._hide)

    def set_text(self, t: str):
        self.text = t
        if self._tip:
            self._tip.destroy()
            self._tip = None
            self._show()

    def _schedule(self, _):
        self._cancel()
        self._id = self.widget.after(self.delay, self._show)

    def _cancel(self):
        if self._id:
            self.widget.after_cancel(self._id)
            self._id = None

    def _show(self):
        if self._tip or not self.text:
            return
        x = self.widget.winfo_rootx() + 20
        y = self.widget.winfo_rooty() + self.widget.winfo_height() + 10
        tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        lbl = tk.Label(
            tw, text=self.text, background="#333", foreground="#fff",
            justify="left", relief="solid", borderwidth=1, padx=8, pady=5,
            font=("Segoe UI", 9), wraplength=320
        )
        lbl.pack()
        self._tip = tw

    def _hide(self, _):
        self._cancel()
        if self._tip:
            self._tip.destroy()
            self._tip = None


# -------------------- Dialogs --------------------

class BillDialog(simpledialog.Dialog):
    def __init__(self, parent, title, bill: Optional[Bill] = None):
        self.bill = bill
        super().__init__(parent, title)

    def body(self, master):
        ttk.Label(master, text="Name:").grid(row=0, column=0, sticky="e", padx=6, pady=4)
        self.e_name = ttk.Entry(master, width=26); self.e_name.grid(row=0, column=1, sticky="w")

        ttk.Label(master, text="Total:").grid(row=1, column=0, sticky="e", padx=6, pady=4)
        self.e_total = ttk.Entry(master, width=12); self.e_total.grid(row=1, column=1, sticky="w")

        ttk.Label(master, text="Due date:").grid(row=2, column=0, sticky="e", padx=6, pady=4)
        self.e_due = DateEntry(master, width=14, date_pattern="yyyy-mm-dd"); self.e_due.grid(row=2, column=1, sticky="w")

        ttk.Label(master, text="Priority (1-5):").grid(row=3, column=0, sticky="e", padx=6, pady=4)
        self.e_pri = ttk.Spinbox(master, from_=1, to=5, width=5); self.e_pri.grid(row=3, column=1, sticky="w")

        if self.bill:
            self.e_name.insert(0, self.bill.name)
            self.e_total.insert(0, f"{self.bill.total:.2f}")
            self.e_due.set_date(self.bill.due_date)
            self.e_pri.delete(0, "end"); self.e_pri.insert(0, str(self.bill.priority))
        return self.e_name

    def validate(self):
        try:
            name = self.e_name.get().strip()
            total = float(self.e_total.get())
            return bool(name) and total > 0
        except Exception:
            return False

    def apply(self):
        name = self.e_name.get().strip()
        total = float(self.e_total.get())
        due = self.e_due.get_date().isoformat()
        pri = int(self.e_pri.get())
        if self.bill:
            self.result = Bill(
                name=name, total=total, due=due, priority=pri,
                color=self.bill.color, payments=self.bill.payments[:]
            )
        else:
            self.result = Bill(name=name, total=total, due=due, priority=pri, color="", payments=[])


class RangeDialog(simpledialog.Dialog):
    def __init__(self, parent, title, start: Optional[date] = None, end: Optional[date] = None):
        self._start = start or date.today()
        self._end = end or (self._start + timedelta(days=30))
        super().__init__(parent, title)

    def body(self, master):
        ttk.Label(master, text="Start:").grid(row=0, column=0, sticky="e", padx=6, pady=4)
        self.e_start = DateEntry(master, width=14, date_pattern="yyyy-mm-dd"); self.e_start.grid(row=0, column=1, sticky="w"); self.e_start.set_date(self._start)

        ttk.Label(master, text="End:").grid(row=1, column=0, sticky="e", padx=6, pady=4)
        self.e_end = DateEntry(master, width=14, date_pattern="yyyy-mm-dd"); self.e_end.grid(row=1, column=1, sticky="w"); self.e_end.set_date(self._end)
        return self.e_start

    def validate(self):
        s = self.e_start.get_date(); e = self.e_end.get_date()
        return s <= e

    def apply(self):
        self.result = (self.e_start.get_date(), self.e_end.get_date())


# -------------------- App --------------------

class DebtCalendarApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.minsize(1000, 620)

        self.bills: List[Bill] = []
        self.plan: Optional[Plan] = None
        self.auto_calc = tk.BooleanVar(value=True)

        self._assign_colors_called = False

        # Undo stack: (bills_copy, plan_copy, auto_calc_flag)
        self._undo_stack: List[Tuple[List[Bill], Optional[Plan], bool]] = []

        bills, plan, auto = load_state()
        self.bills, self.plan = bills, plan
        self.auto_calc.set(auto)

        self._assign_colors()
        self._build_styles()
        self._build_ui()

        # Default to current month page if no plan
        if not self.plan:
            s, e = self._month_bounds(date.today())
            self.plan = Plan(start=s.isoformat(), end=e.isoformat())

        self._recompute_schedule()
        self._refresh_all()

        # Global shortcuts
        self.bind_all("<Control-n>", lambda e: self._edit_bill(Bill(name="", total=0, due=date.today().isoformat(), priority=3, color="")))
        self.bind_all("<Control-f>", lambda e: self._quick_find())
        self.bind_all("<Control-z>", lambda e: self._undo())

    # ---------- Styles/UI ----------

    def _build_styles(self):
        style = ttk.Style(self)
        style.configure("Header.TLabel", font=("Segoe UI Semibold", 11))
        style.configure("Cell.TFrame", relief="groove", borderwidth=1)

        style.configure("Total.Horizontal.TProgressbar", thickness=10)
        for i, _ in enumerate(PALETTE):
            style.configure(f"Bill{i}.Horizontal.TProgressbar", thickness=10)

        style.configure("Legend.TButton", padding=(10, 4))  # larger click targets

    def _build_ui(self):
        top = ttk.Frame(self); top.pack(side="top", fill="x")

        ttk.Button(top, text="Toggle Sidebar", command=self._toggle_sidebar).pack(side="left", padx=6, pady=6)

        ttk.Label(top, text="Auto-calc daily budget:", padding=(8, 0)).pack(side="left")
        ttk.Checkbutton(top, variable=self.auto_calc, command=self._persist).pack(side="left", padx=(0, 8))

        # Accessibility: font scale
        self.font_scale = tk.DoubleVar(value=1.0)
        ttk.Scale(top, from_=0.85, to=1.5, variable=self.font_scale,
                  command=lambda v: self._apply_font_scale()).pack(side="left", padx=8)
        ttk.Label(top, text="A⇕").pack(side="left")

        # High contrast toggle
        self.high_contrast = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="High contrast", variable=self.high_contrast,
                        command=self._toggle_contrast).pack(side="left", padx=6)

        ttk.Button(top, text="Add Payday", command=self._add_payday).pack(side="left", padx=4)
        ttk.Button(top, text="Export CSV", command=self._export_csv).pack(side="left", padx=4)

        ttk.Button(top, text="Today", command=self._go_today).pack(side="left", padx=4, pady=6)
        ttk.Button(top, text="◄ Previous", command=self._prev_month).pack(side="left", padx=2)
        ttk.Button(top, text="Next ►", command=self._next_month).pack(side="left", padx=2)

        # Save status indicator
        self.save_status = tk.StringVar(value="")
        ttk.Label(top, textvariable=self.save_status).pack(side="left", padx=8)

        self.lbl_range = ttk.Label(top, text="", font=("Segoe UI Semibold", 11)); self.lbl_range.pack(side="right", padx=8)
        ttk.Button(top, text="New Budget", command=self._new_budget).pack(side="right", padx=(4, 8))
        ttk.Button(top, text="Set Schedule", command=self._set_schedule).pack(side="right", padx=4)

        self.pane = ttk.Panedwindow(self, orient="horizontal"); self.pane.pack(side="top", fill="both", expand=True)

        self.cal_wrap = ttk.Frame(self.pane); self.pane.add(self.cal_wrap, weight=5)
        self.side_wrap = ttk.Frame(self.pane); self.pane.add(self.side_wrap, weight=3)

        self._build_calendar(self.cal_wrap)
        self._build_legend(self.side_wrap)

        self.after(10, lambda: self.pane.sashpos(0, int(self.winfo_width() * 0.66)))
        self.bind("<Configure>", lambda e: self._resize_cells())

    def _build_calendar(self, parent):
        self.grid_frame = ttk.Frame(parent); self.grid_frame.pack(fill="both", expand=True)
        for r in range(6):
            self.grid_frame.rowconfigure(r, weight=1)
            for c in range(7):
                self.grid_frame.columnconfigure(c, weight=1)
        self._cell_frames: List[ttk.Frame] = []
        for r in range(6):
            for c in range(7):
                f = ttk.Frame(self.grid_frame, style="Cell.TFrame")
                f.grid(row=r, column=c, sticky="nsew", padx=4, pady=4)
                self._cell_frames.append(f)

    def _build_legend(self, parent):
        header = ttk.Frame(parent); header.pack(fill="x")
        ttk.Label(header, text="Legend / Bills", style="Header.TLabel").pack(side="left", padx=8, pady=8)

        self.total_paid_var = tk.StringVar(value="Total paid: $0.00 / $0.00")
        ttk.Label(parent, textvariable=self.total_paid_var, padding=(8, 0)).pack(anchor="w")
        self.total_pbar = ttk.Progressbar(parent, style="Total.Horizontal.TProgressbar", maximum=1.0)
        self.total_pbar.pack(fill="x", padx=8, pady=(0, 8))

        # Scrollable legend
        self.legend_canvas = tk.Canvas(parent, borderwidth=0, highlightthickness=0)
        self.legend_scroll = ttk.Scrollbar(parent, orient="vertical", command=self.legend_canvas.yview)
        self.legend_inner = ttk.Frame(self.legend_canvas)

        self.legend_inner.bind(
            "<Configure>",
            lambda e: self.legend_canvas.configure(scrollregion=self.legend_canvas.bbox("all")),
        )
        self.legend_canvas.create_window((0, 0), window=self.legend_inner, anchor="nw")
        self.legend_canvas.configure(yscrollcommand=self.legend_scroll.set)

        self.legend_canvas.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=(4, 8))
        self.legend_scroll.pack(side="right", fill="y", padx=(0, 8), pady=(4, 8))

    # ---------- Actions ----------

    def _snapshot(self):
        # push undo snapshot
        self._undo_stack.append((json.loads(json.dumps([asdict(x) for x in self.bills])),
                                 Plan(self.plan.start, self.plan.end, dict(self.plan.schedule), dict(getattr(self.plan, "income", {}))) if self.plan else None,
                                 self.auto_calc.get()))

    def _persist(self):
        save_state(self.bills, self.plan, self.auto_calc.get())
        # Flash "Saved ✓"
        self.save_status.set("Saved ✓")
        self.after(1200, lambda: self.save_status.set(""))

    def _toggle_sidebar(self):
        panes = self.pane.panes()
        if len(panes) == 2:
            self.pane.forget(self.side_wrap)
        else:
            self.pane.add(self.side_wrap, weight=3)
        self.after(5, self._resize_cells)

    def _set_schedule(self):
        defaults = (self.plan.start_date, self.plan.end_date) if self.plan else (date.today(), date.today())
        dlg = RangeDialog(self, "Set Schedule", *defaults)
        if not dlg.result:
            return
        self._snapshot()
        s, e = dlg.result
        self.plan = Plan(start=s.isoformat(), end=e.isoformat())
        self._recompute_schedule(); self._refresh_all(); self._persist()

    def _new_budget(self):
        if not messagebox.askyesno("New Budget", "Start a new budget? This clears all payments and the schedule."):
            return
        self._snapshot()
        for b in self.bills:
            b.payments.clear()
        s, e = self._month_bounds(date.today())
        self.plan = Plan(start=s.isoformat(), end=e.isoformat())
        self._recompute_schedule(); self._refresh_all(); self._persist()

    def _go_today(self):
        s, e = self._month_bounds(date.today())
        self._snapshot()
        self.plan.start, self.plan.end = s.isoformat(), e.isoformat()
        self._recompute_schedule(); self._refresh_all(); self._persist()

    def _prev_month(self):
        cur_first = self._current_month_first()
        prev_month_last_day = cur_first - timedelta(days=1)
        s, e = self._month_bounds(prev_month_last_day)
        self._snapshot()
        self.plan.start, self.plan.end = s.isoformat(), e.isoformat()
        self._recompute_schedule(); self._refresh_all(); self._persist()

    def _next_month(self):
        cur_last = self._current_month_last()
        next_month_first = cur_last + timedelta(days=1)
        s, e = self._month_bounds(next_month_first)
        self._snapshot()
        self.plan.start, self.plan.end = s.isoformat(), e.isoformat()
        self._recompute_schedule(); self._refresh_all(); self._persist()

    # ---------- Schedule logic ----------

    def _assign_colors(self):
        if self._assign_colors_called:
            return
        for i, b in enumerate(self.bills):
            if not b.color:
                b.color = PALETTE[i % len(PALETTE)]
        self._assign_colors_called = True

    # --- Smarter urgency score & sorting ---
    def _urgency_score(self, bill: "Bill", on_day: date) -> float:
        """Higher score = more urgent."""
        days_to_due = (bill.due_date - on_day).days
        past_due_boost = 10_000 if days_to_due < 0 else 0  # extreme boost if overdue
        # Quadratic ramp toward due date (closer = steeper)
        due_ramp = (max(0, 45 - max(days_to_due, 0)) ** 2)  # 0..~2025
        # Priority factor: P1=1.6 … P5=1.0
        pri_factor = 1.6 - 0.15 * (max(1, min(5, bill.priority)) - 1)
        # Remaining % (0..1): larger remaining -> more urgent
        rem_pct = 0.0 if bill.total <= 0 else (bill.remaining / bill.total)
        # Missed payments penalty (small, stacks)
        missed_penalty = sum(1 for p in bill.payments if p.amount == 0.0) * 125
        return past_due_boost + (due_ramp * pri_factor) + (rem_pct * 800) + missed_penalty

    def _sort_items_for_day(self, items: list, on_day: date):
        """Sort in-place by urgency score then by due date then name."""
        def key_fn(item):
            nm, _ = item
            b = self._bill_by_name(nm)
            if not b:
                return (0, date.max, nm)
            return (-self._urgency_score(b, on_day), b.due_date, b.name)
        items.sort(key=key_fn)

    def _priority_key(self, bill: Bill, on_day: date) -> Tuple[int, int, int]:
        # kept for compatibility in any external code; not used for UI ordering anymore
        days_to_due = (bill.due_date - on_day).days
        past_due = 1 if days_to_due < 0 else 0
        return (past_due, max(days_to_due, 0), bill.priority)

    def _recompute_schedule(self):
        if not self.plan:
            return
        days_all = self.plan.days()
        if not days_all:
            return
        schedule: Dict[str, List[Tuple[str, float]]] = {d.isoformat(): [] for d in days_all}

        for b in self.bills:
            rem = b.remaining
            if rem <= 0:
                continue

            last_day = min(self.plan.end_date, b.due_date)
            if last_day < self.plan.start_date:
                # Past due when window starts -> schedule on first visible day
                schedule[self.plan.start_date.isoformat()].append((b.name, round(rem, 2)))
                continue

            # Eligible days for this bill (inclusive)
            days_for_bill = [d for d in days_all if self.plan.start_date <= d <= last_day]
            n = len(days_for_bill)
            if n <= 0:
                continue

            # Base urgency ramp (toward due date)
            base = [(i + 1) ** 1.6 for i in range(n)]
            # Priority boost (P1 highest). Each step reduces priority number ⇒ bigger boost
            pri_boost = 1.0 + (5 - max(1, min(5, b.priority))) * 0.15
            weights = [w * pri_boost for w in base]
            total_w = sum(weights)

            cents_total = int(round(rem * 100))
            alloc_cents = [int(math.floor(cents_total * w / total_w)) for w in weights]
            remainder = cents_total - sum(alloc_cents)
            for k in range(remainder):
                idx = n - 1 - (k % n)
                alloc_cents[idx] += 1

            for d, cents in zip(days_for_bill, alloc_cents):
                if cents <= 0:
                    continue
                schedule[d.isoformat()].append((b.name, cents / 100.0))

        # ---- Payday-aware allocation guard ----
        available = 0.0
        for d in days_all:
            available += self.plan.income.get(d.isoformat(), 0.0)
            day_key = d.isoformat()
            day_items = schedule[day_key]
            needed = sum(a for _, a in day_items)
            if needed > available:
                if needed > 0:
                    factor = 0.0 if available <= 0 else (available / needed)
                    carry = []
                    for i, (nm, a) in enumerate(day_items):
                        new_a = round(a * factor, 2)
                        push = round(a - new_a, 2)
                        day_items[i] = (nm, new_a) if new_a >= 0.01 else None
                        if push >= 0.01:
                            carry.append((nm, push))
                    schedule[day_key] = [x for x in day_items if x]
                    nd = d + timedelta(days=1)
                    if nd.isoformat() in schedule:
                        schedule[nd.isoformat()].extend(carry)
                available = 0.0
            else:
                available -= needed

        # Sort each day by urgency
        for key in schedule:
            self._sort_items_for_day(schedule[key], datetime.strptime(key, "%Y-%m-%d").date())

        self.plan.schedule = schedule

    # ---------- Rendering ----------

    def _refresh_all(self):
        if self.plan:
            self.lbl_range.config(text=f"{self.plan.start_date:%b %d, %Y} → {self.plan.end_date:%b %d, %Y}")
        else:
            self.lbl_range.config(text="(no schedule)")
        self._render_calendar()
        self._render_legend()
        self._update_totals()
        self._persist()

    def _render_calendar(self):
        if not self.plan:
            return
        for f in self._cell_frames:
            for w in f.winfo_children():
                w.destroy()

        # Fill 6x7 with the full calendar grid for the current month
        first = self._current_month_first()
        last = self._current_month_last()

        # Start grid at Monday for consistency (ISO)
        start_grid = first - timedelta(days=(first.weekday()))
        slots = [start_grid + timedelta(days=i) for i in range(42)]

        for idx, f in enumerate(self._cell_frames):
            d = slots[idx]
            title = ttk.Label(
                f,
                text=f"{d:%b %d}" if d.day == 1 or idx % 7 == 0 else f"{d.day:02d}",
                font=("Segoe UI", 10, "bold")
            )
            title.pack(anchor="nw", padx=6, pady=(6, 2))

            # Grey out days not in the visible month
            in_month = (first.month == d.month)
            if not in_month:
                title.configure(foreground="#888")

            # Click anywhere in the cell to open menu (no auto payment on click)
            self._attach_cell_menu_to_frame(f, d)

            # Render items
            items = self.plan.schedule.get(d.isoformat(), [])
            # Tooltip on date cell with total scheduled today
            sum_amt = sum(a for _, a in items) if items else 0.0
            Tooltip(title, f"Scheduled today: ${sum_amt:.2f}")

            for bill_name, amt in items:
                b = self._bill_by_name(bill_name)
                if not b:  # safety
                    continue
                row = ttk.Frame(f)
                row.pack(anchor="nw", fill="x", padx=6, pady=(0, 2))

                bullet = tk.Canvas(row, width=10, height=10, highlightthickness=0)
                bullet.create_rectangle(0, 0, 10, 10, fill=b.color, outline=b.color)
                bullet.grid(row=0, column=0, sticky="nw")

                lbl = tk.Label(
                    row, text=f"{bill_name} —\n${amt:.2f}",
                    justify="left", fg=b.color, font=("Segoe UI", 9, "bold"),
                )
                lbl.grid(row=0, column=1, sticky="w", padx=(6, 0))
                self._attach_cell_menu(lbl, d, b, amt)

                ttxt = [f"Due: {b.due_date:%Y-%m-%d} (P{b.priority})",
                        f"Remaining now: ${b.remaining:.2f}"]
                Tooltip(lbl, "\n".join(ttxt))

        self.after(10, self._resize_cells)

    def _resize_cells(self):
        self.grid_frame.update_idletasks()

    def _render_legend(self, filter_term: Optional[str] = None):
        for w in self.legend_inner.winfo_children():
            w.destroy()

        today = self.plan.start_date if self.plan else date.today()
        ordered = sorted(self.bills, key=lambda b: -self._urgency_score(b, today))
        ordered = [b for b in ordered if (not filter_term or filter_term in b.name.lower())]

        for i, b in enumerate(ordered):
            row = ttk.Frame(self.legend_inner); row.pack(fill="x", padx=8, pady=(4, 10))
            row.columnconfigure(1, weight=1)  # label/progress area stretches

            chip = tk.Canvas(row, width=14, height=14, highlightthickness=0)
            chip.create_rectangle(0, 0, 14, 14, fill=b.color, outline=b.color)
            chip.grid(row=0, column=0, rowspan=2, sticky="nw", padx=(0, 6))

            txt = ttk.Label(
                row,
                text=f"{b.name} — ${b.remaining:.2f} remaining of ${b.total:.2f} — due {b.due_date:%Y-%m-%d}\n(P{b.priority})",
                justify="left", wraplength=520
            )
            txt.grid(row=0, column=1, columnspan=1, sticky="w")

            pbar = ttk.Progressbar(row, style=f"Bill{i%len(PALETTE)}.Horizontal.TProgressbar", maximum=1.0)
            frac = 0.0 if b.total <= 0 else (b.paid_amount / b.total)
            pbar["value"] = min(max(frac, 0.0), 1.0)
            pbar.grid(row=1, column=1, sticky="ew", pady=(4, 2))

            # Buttons stacked in their own column; fixed width so they never clip
            btn_col = ttk.Frame(row); btn_col.grid(row=0, column=2, rowspan=2, sticky="ne", padx=(10, 0))
            for label, cmd in (
                ("History", lambda bb=b: self._show_history(bb)),
                ("Edit",    lambda bb=b: self._edit_bill(bb)),
                ("Delete",  lambda bb=b: self._delete_bill(bb)),
            ):
                bttn = ttk.Button(btn_col, text=label, width=9, command=cmd, style="Legend.TButton")
                bttn.pack(anchor="ne", pady=1)

            # Tooltip on progress
            if b.payments:
                ttext = "Payments:\n" + "\n".join(f"{p.when}: ${p.amount:.2f} ({p.note})" for p in b.payments[-8:])
            else:
                ttext = "No payments recorded for this bill."
            Tooltip(pbar, ttext)

        ttk.Frame(self.legend_inner).pack(pady=6)

    def _update_totals(self):
        total = sum(b.total for b in self.bills)
        paid = sum(b.paid_amount for b in self.bills)
        self.total_paid_var.set(f"Total paid: ${paid:.2f} / ${total:.2f}")
        self.total_pbar["value"] = 0.0 if total <= 0 else (paid / total)

    # ---------- Cell interaction ----------

    def _attach_cell_menu_to_frame(self, frame: ttk.Frame, d: date):
        menu = tk.Menu(self, tearoff=0)

        def build_for_day():
            menu.delete(0, "end")
            items = self.plan.schedule.get(d.isoformat(), [])
            if not items:
                menu.add_command(label="No items scheduled", state="disabled")
                return
            menu.add_command(label=f"{d:%Y-%m-%d}")
            menu.add_separator()
            # For each bill on that day add a cascade
            for bill_name, amt in items:
                b = self._bill_by_name(bill_name)
                if not b:
                    continue
                sub = tk.Menu(menu, tearoff=0)
                sub.add_command(label=f"Mark Paid (${amt:.2f})", command=lambda bb=b, a=amt: self._mark_paid(bb, d, a))
                sub.add_command(label="Mark Partial…", command=lambda bb=b, a=amt: self._mark_partial(bb, d, a))
                sub.add_command(label="Mark Missed", command=lambda bb=b, a=amt: self._mark_missed(bb, d, a))
                sub.add_separator()
                sub.add_command(label="Revert last for this bill", command=lambda bb=b: self._revert_last(bb))
                menu.add_cascade(label=bill_name, menu=sub)

        def show_menu(ev=None):
            build_for_day()
            x = frame.winfo_rootx() + 20
            y = frame.winfo_rooty() + 20
            try:
                menu.tk_popup(x if not ev else ev.x_root, y if not ev else ev.y_root)
            finally:
                menu.grab_release()

        frame.bind("<Button-1>", show_menu)
        frame.bind("<Button-3>", show_menu)

    def _attach_cell_menu(self, widget: tk.Widget, d: date, bill: Bill, amt: float):
        menu = tk.Menu(self, tearoff=0)
        menu.add_command(label=f"{bill.name} on {d:%Y-%m-%d}", state="disabled")
        menu.add_separator()
        menu.add_command(label=f"Mark Paid (${amt:.2f})", command=lambda: self._mark_paid(bill, d, amt))
        menu.add_command(label="Mark Partial…", command=lambda: self._mark_partial(bill, d, amt))
        menu.add_command(label="Mark Missed", command=lambda: self._mark_missed(bill, d, amt))
        menu.add_separator()
        menu.add_command(label="Revert last payment", command=lambda: self._revert_last(bill))

        def show(ev):
            try:
                menu.tk_popup(ev.x_root, ev.y_root)
            finally:
                menu.grab_release()

        widget.bind("<Button-1>", show)
        widget.bind("<Button-3>", show)

    def _mark_paid(self, bill: Bill, d: date, amt: float):
        self._snapshot()
        pay = min(amt, bill.remaining)
        if pay <= 0:
            return
        bill.add_payment(d, pay, "paid")
        self._recompute_schedule(); self._refresh_all()

    def _mark_partial(self, bill: Bill, d: date, amt: float):
        rem = bill.remaining
        if rem <= 0:
            return
        s = simpledialog.askstring("Partial Payment", f"Enter amount (remaining ${rem:.2f}):", parent=self)
        if not s:
            return
        try:
            val = float(s); val = max(0.01, min(val, rem))
        except Exception:
            return
        self._snapshot()
        bill.add_payment(d, val, "partial")
        self._recompute_schedule(); self._refresh_all()

    def _mark_missed(self, bill: Bill, d: date, amt: float):
        self._snapshot()
        bill.add_payment(d, 0.0, "missed")
        self._recompute_schedule(); self._refresh_all()

    def _revert_last(self, bill: Bill):
        if not bill.payments:
            messagebox.showinfo("Revert", "No payments to revert for this bill.")
            return
        last = bill.payments[-1]
        if not messagebox.askyesno("Revert last payment", f"Remove last payment on {last.when} for ${last.amount:.2f}?"):
            return
        self._snapshot()
        bill.payments.pop()
        self._recompute_schedule(); self._refresh_all()

    # ---------- Legend actions (History with Revert) ----------

    def _show_history(self, bill: Bill):
        win = tk.Toplevel(self)
        win.title(f"History — {bill.name}")
        win.transient(self)
        win.grab_set()
        win.geometry("+%d+%d" % (self.winfo_rootx() + 80, self.winfo_rooty() + 80))

        cols = ("when", "amount", "note")
        tree = ttk.Treeview(win, columns=cols, show="headings", height=12)
        for c, w in zip(cols, (110, 100, 280)):
            tree.heading(c, text=c.title())
            tree.column(c, width=w, anchor="w")
        tree.pack(side="top", fill="both", expand=True, padx=8, pady=8)

        for idx, p in enumerate(bill.payments):
            tree.insert("", "end", iid=str(idx), values=(p.when, f"${p.amount:.2f}", p.note))

        btns = ttk.Frame(win); btns.pack(fill="x", padx=8, pady=(0, 8))
        ttk.Button(btns, text="Revert Selected", command=lambda: do_revert()).pack(side="left")
        ttk.Button(btns, text="Close", command=win.destroy).pack(side="right")

        def do_revert():
            sel = tree.selection()
            if not sel:
                messagebox.showinfo("Revert", "Select a payment to revert.")
                return
            idx = int(sel[0])
            p = bill.payments[idx]
            if not messagebox.askyesno("Revert Selected", f"Remove payment on {p.when} for ${p.amount:.2f}?"):
                return
            self._snapshot()
            bill.revert_idx(idx)
            self._recompute_schedule(); self._refresh_all()
            win.destroy()

    def _edit_bill(self, bill: Bill):
        dlg = BillDialog(self, "Edit Bill", bill)
        if not dlg.result:
            return
        edited: Bill = dlg.result
        self._snapshot()
        bill.name, bill.total, bill.due, bill.priority = edited.name, edited.total, edited.due, edited.priority
        self._recompute_schedule(); self._refresh_all()

    def _delete_bill(self, bill: Bill):
        if not messagebox.askyesno("Delete Bill", f"Delete '{bill.name}'? This cannot be undone."):
            return
        self._snapshot()
        self.bills.remove(bill)
        self._recompute_schedule(); self._refresh_all()

    # ---------- Helpers ----------

    def _bill_by_name(self, name: str) -> Optional[Bill]:
        for b in self.bills:
            if b.name == name:
                return b
        return None

    def _month_bounds(self, any_day: date) -> Tuple[date, date]:
        first = any_day.replace(day=1)
        # next month first
        if first.month == 12:
            nm_first = first.replace(year=first.year + 1, month=1)
        else:
            nm_first = first.replace(month=first.month + 1)
        last = nm_first - timedelta(days=1)
        return first, last

    def _current_month_first(self) -> date:
        return self.plan.start_date.replace(day=1)

    def _current_month_last(self) -> date:
        first = self._current_month_first()
        s, e = self._month_bounds(first)
        return e

    # ---------- UX helpers ----------

    def _quick_find(self):
        term = simpledialog.askstring("Find Bill", "Search by name:", parent=self)
        if not term:
            return
        self._render_legend(filter_term=term.lower())

    def _undo(self):
        if not self._undo_stack:
            messagebox.showinfo("Undo", "Nothing to undo.")
            return
        bills_raw, plan_copy, auto = self._undo_stack.pop()
        self.bills = [_bill_from_dict(b) for b in bills_raw]
        self.plan = plan_copy
        self.auto_calc.set(auto)
        self._assign_colors(); self._recompute_schedule(); self._refresh_all()

    # ---------- Accessibility ----------

    def _apply_font_scale(self):
        s = float(self.font_scale.get())
        self.option_add("*Font", ("Segoe UI", int(10*s)))
        self._refresh_all()

    CB_PALETTE = ["#000000","#004949","#009292","#ff6db6","#ffb6db",
                  "#490092","#006ddb","#b66dff","#6db6ff","#b6dbff"]  # Okabe–Ito style

    def _toggle_contrast(self):
        global PALETTE
        PALETTE[:] = self.CB_PALETTE if self.high_contrast.get() else [
            "#FFB300","#00A6ED","#114B5F","#F46036","#9B5DE5",
            "#00C2A8","#FF6B6B","#4D908E","#2E86AB","#F25F5C",
        ]
        # Re-assign colors consistently
        self._assign_colors_called = False
        self._assign_colors()
        self._build_styles()
        self._refresh_all()

    # ---------- Paydays & Export ----------

    def _add_payday(self):
        dlg = RangeDialog(self, "Pick Payday (start=end to select one day)",
                          start=self.plan.start_date, end=self.plan.start_date)
        if not dlg.result:
            return
        s, e = dlg.result
        amt_str = simpledialog.askstring("Payday Amount", "Amount received:", parent=self)
        if not amt_str:
            return
        try:
            amt = max(0.0, float(amt_str))
        except Exception:
            return
        self.plan.income.setdefault(s.isoformat(), 0.0)
        self.plan.income[s.isoformat()] += amt
        self._recompute_schedule(); self._refresh_all()

    def _export_csv(self):
        # Writes all bills, payments, and scheduled plan to a CSV
        path = filedialog.asksaveasfilename(
            title="Export CSV",
            defaultextension=".csv",
            filetypes=[("CSV", "*.csv")]
        )
        if not path:
            return
        import csv
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["Type","Name","Date","Amount","Note/Info"])
            # Payments
            for b in self.bills:
                for p in b.payments:
                    w.writerow(["payment", b.name, p.when, f"{p.amount:.2f}", p.note])
            # Planned schedule
            if self.plan:
                for d, items in sorted(self.plan.schedule.items()):
                    for nm, a in items:
                        w.writerow(["planned", nm, d, f"{a:.2f}", ""])
                # Paydays
                for d, amt in sorted(self.plan.income.items()):
                    w.writerow(["payday", "", d, f"{amt:.2f}", "income"])
        messagebox.showinfo("Export CSV", f"Exported to:\n{path}")


# -------------------- Seed on first run (optional demo) --------------------

def first_run_seed_if_empty(app: DebtCalendarApp):
    if app.bills:
        return
    today = date.today()
    examples = [
        ("Power", 451.89, today + timedelta(days=8), 1),
        ("Car", 1246.40, today + timedelta(days=15), 1),
        ("Water", 157.60, today + timedelta(days=15), 2),
        ("Visa", 440.00, today + timedelta(days=20), 3),
        ("Capital One", 400.00, today + timedelta(days=23), 3),
        ("Atlas MC", 50.00, today + timedelta(days=12), 3),
        ("Cash App", 250.00, today + timedelta(days=13), 3),
        ("BNPL", 450.00, today + timedelta(days=27), 4),
        ("WiFi", 480.00, today + timedelta(days=35), 5),
    ]
    for i, (n, t, d, p) in enumerate(examples):
        app.bills.append(Bill(name=n, total=t, due=d.isoformat(), priority=p,
                              color=PALETTE[i % len(PALETTE)], payments=[]))
    app._recompute_schedule()
    save_state(app.bills, app.plan, app.auto_calc.get())


# -------------------- Main --------------------

if __name__ == "__main__":
    print("Starting Debt Calendar Planner...")
    app = DebtCalendarApp()
    first_run_seed_if_empty(app)
    app.mainloop()
