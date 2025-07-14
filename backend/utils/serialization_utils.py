"""
This module provides enhanced JSON serialization capabilities for complex data types
used within the A1Betting platform, such as dataclasses, Enums, and datetime objects.

It offers a safer alternative to pickle for inter-process communication and caching.
"""

import json
from datetime import datetime, timezone
from enum import Enum
from dataclasses import is_dataclass, asdict
from typing import Any, Dict

# A registry to hold all the classes we can serialize/deserialize.
# This is a security measure to prevent arbitrary class instantiation.
SERIALIZABLE_CLASSES = {}

def register_serializable(cls):
    """A class decorator to register a class as serializable."""
    SERIALIZABLE_CLASSES[cls.__name__] = cls
    return cls

class EnhancedJSONEncoder(json.JSONEncoder):
    """
    A custom JSON encoder that handles special types like dataclasses,
    datetime objects, and Enums.
    """
    def default(self, o: Any) -> Any:
        if is_dataclass(o):
            # Add a __type__ key to identify the original class for deserialization.
            return {**asdict(o), "__type__": o.__class__.__name__}
        if isinstance(o, datetime):
            # Always convert datetime to UTC and store in ISO format with timezone.
            return {"__type__": "datetime", "value": o.astimezone(timezone.utc).isoformat()}
        if isinstance(o, Enum):
            # Store the enum's class and member name.
            return {"__type__": "enum", "class": o.__class__.__name__, "member": o.name}
        
        return super().default(o)

def object_hook(d: Dict[str, Any]) -> Any:
    """
    A custom object hook for json.loads that reconstructs our custom objects
    from the JSON representation.
    """
    obj_type = d.get("__type__")
    if not obj_type:
        return d

    if obj_type == "datetime":
        return datetime.fromisoformat(d["value"])
    
    if obj_type == "enum":
        cls = SERIALIZABLE_CLASSES.get(d["class"])
        if cls and issubclass(cls, Enum):
            return cls[d["member"]]
        # If the class isn't registered or isn't an enum, we can't safely proceed.
        raise TypeError(f"Cannot deserialize unregistered or non-Enum class: {d['class']}")

    # Handle registered dataclasses
    cls = SERIALIZABLE_CLASSES.get(obj_type)
    if cls and is_dataclass(cls):
        # Remove our custom type hint before passing to the class constructor.
        d.pop("__type__")
        # Recursively deserialize nested objects
        for key, value in d.items():
            if isinstance(value, dict):
                d[key] = object_hook(value)
        return cls(**d)

    # If the type is not recognized, return the dict as is.
    return d

def safe_dumps(data: Any) -> str:
    """
    Serializes data to a JSON string using the enhanced encoder.
    This is the safe alternative to pickle.dumps().
    """
    return json.dumps(data, cls=EnhancedJSONEncoder)

def safe_loads(s: str) -> Any:
    """
    Deserializes a JSON string into Python objects using the custom object hook.
    This is the safe alternative to pickle.loads().
    """
    return json.loads(s, object_hook=object_hook) 