import logging
from typing import Any

class MockPlan:
    def __init__(self):
        self.iterations = 0
    def is_complete(self) -> bool:
        self.iterations += 1
        return self.iterations > 2

def generate_recursive_plan(context: Any) -> MockPlan:
    logging.info(f"[agent_planner] generate_recursive_plan called with context: {context}")
    return MockPlan() 