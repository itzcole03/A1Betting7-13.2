"""
Data Redaction Service

Secure redaction of sensitive identifiers from logs and rationale outputs
to protect provider internal IDs and other sensitive information.
"""

import re
import json
from enum import Enum
from typing import Dict, List, Optional, Any, Pattern, Union, Set
from dataclasses import dataclass, field
import hashlib

from backend.services.unified_logging import get_logger

logger = get_logger("data_redaction")


class RedactionLevel(Enum):
    """Levels of redaction intensity"""
    MINIMAL = "minimal"  # Only most sensitive data
    STANDARD = "standard"  # Standard sensitive data
    AGGRESSIVE = "aggressive"  # All potentially sensitive data
    PARANOID = "paranoid"  # Maximum redaction


class RedactionMethod(Enum):
    """Methods for redacting data"""
    MASK = "mask"  # Replace with asterisks
    HASH = "hash"  # Replace with hash
    REMOVE = "remove"  # Remove entirely
    PLACEHOLDER = "placeholder"  # Replace with generic placeholder


@dataclass
class RedactionRule:
    """Configuration for a redaction rule"""
    pattern: Pattern[str]
    method: RedactionMethod
    replacement: Optional[str] = None
    preserve_length: bool = True
    preserve_format: bool = False  # Keep format like "XXX-XXX-XXXX" for phone numbers
    category: str = "general"
    description: str = ""
    
    def apply(self, text: str, match_obj: re.Match) -> str:
        """Apply redaction rule to matched text"""
        matched_text = match_obj.group()
        
        if self.method == RedactionMethod.REMOVE:
            return ""
        
        elif self.method == RedactionMethod.HASH:
            # Create consistent hash for same value
            hash_value = hashlib.sha256(matched_text.encode()).hexdigest()[:8]
            return f"[HASH:{hash_value}]"
        
        elif self.method == RedactionMethod.PLACEHOLDER:
            if self.replacement:
                return self.replacement
            return f"[REDACTED_{self.category.upper()}]"
        
        elif self.method == RedactionMethod.MASK:
            if self.preserve_format:
                # Preserve structure but mask characters
                return re.sub(r'[a-zA-Z0-9]', '*', matched_text)
            elif self.preserve_length:
                return '*' * len(matched_text)
            else:
                return "****"
        
        return matched_text  # Fallback - no redaction


class DataRedactionService:
    """Service for redacting sensitive data from logs and outputs"""
    
    def __init__(self):
        self.logger = logger
        self._rules: Dict[str, List[RedactionRule]] = {
            "minimal": [],
            "standard": [],
            "aggressive": [],
            "paranoid": []
        }
        
        # Statistics
        self.redactions_performed = 0
        self.patterns_matched = {}
        
        # Initialize default rules
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Setup default redaction rules for different sensitivity levels"""
        
        # Provider Internal IDs (highest priority)
        provider_id_rules = [
            RedactionRule(
                pattern=re.compile(r'\b[Pp]rize[Pp]icks[_-]?(?:ID|id|Id)?[:\s]*([A-Za-z0-9]{8,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="provider_id",
                description="PrizePicks internal IDs"
            ),
            RedactionRule(
                pattern=re.compile(r'\b[Dd]raft[Kk]ings[_-]?(?:ID|id|Id)?[:\s]*([A-Za-z0-9]{8,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="provider_id",
                description="DraftKings internal IDs"
            ),
            RedactionRule(
                pattern=re.compile(r'\b[Ff]an[Dd]uel[_-]?(?:ID|id|Id)?[:\s]*([A-Za-z0-9]{8,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="provider_id",
                description="FanDuel internal IDs"
            ),
            RedactionRule(
                pattern=re.compile(r'\b(?:provider|sportsbook|sb)[_-]?(?:ID|id|Id)[:\s]*([A-Za-z0-9]{6,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="provider_id",
                description="Generic provider IDs"
            )
        ]
        
        # API Keys and Tokens
        api_key_rules = [
            RedactionRule(
                pattern=re.compile(r'\b[Aa]pi[_-]?[Kk]ey[:\s]*([A-Za-z0-9]{16,})', re.IGNORECASE),
                method=RedactionMethod.MASK,
                category="credentials",
                description="API keys"
            ),
            RedactionRule(
                pattern=re.compile(r'\b[Tt]oken[:\s]*([A-Za-z0-9+/]{20,}={0,2})', re.IGNORECASE),
                method=RedactionMethod.MASK,
                category="credentials",
                description="Access tokens"
            ),
            RedactionRule(
                pattern=re.compile(r'\b[Bb]earer\s+([A-Za-z0-9+/]{20,}={0,2})', re.IGNORECASE),
                method=RedactionMethod.MASK,
                category="credentials",
                description="Bearer tokens"
            ),
            RedactionRule(
                pattern=re.compile(r'\bAuthorization[:\s]+Bearer\s+([A-Za-z0-9+/]{20,}={0,2})', re.IGNORECASE),
                method=RedactionMethod.MASK,
                category="credentials",
                description="Authorization headers"
            )
        ]
        
        # Database and Session IDs
        id_rules = [
            RedactionRule(
                pattern=re.compile(r'\b[Uu]ser[_-]?(?:ID|id|Id)[:\s]*([A-Za-z0-9]{8,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="user_data",
                description="User IDs"
            ),
            RedactionRule(
                pattern=re.compile(r'\b[Ss]ession[_-]?(?:ID|id|Id)[:\s]*([A-Za-z0-9]{16,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="session_data",
                description="Session IDs"
            ),
            RedactionRule(
                pattern=re.compile(r'\b(?:uuid|UUID|guid|GUID)[:\s]*([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="identifiers",
                description="UUIDs and GUIDs"
            )
        ]
        
        # Email addresses and phone numbers
        pii_rules = [
            RedactionRule(
                pattern=re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
                method=RedactionMethod.MASK,
                preserve_format=True,
                category="pii",
                description="Email addresses"
            ),
            RedactionRule(
                pattern=re.compile(r'\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b'),
                method=RedactionMethod.MASK,
                preserve_format=True,
                category="pii",
                description="Phone numbers"
            )
        ]
        
        # IP Addresses
        network_rules = [
            RedactionRule(
                pattern=re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'),
                method=RedactionMethod.MASK,
                category="network",
                description="IPv4 addresses"
            ),
            RedactionRule(
                pattern=re.compile(r'\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\b'),
                method=RedactionMethod.MASK,
                category="network", 
                description="IPv6 addresses"
            )
        ]
        
        # Financial data
        financial_rules = [
            RedactionRule(
                pattern=re.compile(r'\b\$[0-9]{4,}\b'),  # Large dollar amounts
                method=RedactionMethod.PLACEHOLDER,
                replacement="$[AMOUNT]",
                category="financial",
                description="Large dollar amounts"
            ),
            RedactionRule(
                pattern=re.compile(r'\b[0-9]{13,19}\b'),  # Credit card numbers
                method=RedactionMethod.MASK,
                category="financial",
                description="Credit card numbers"
            )
        ]
        
        # Internal system identifiers
        system_rules = [
            RedactionRule(
                pattern=re.compile(r'\b(?:internal|private|confidential)[_-]?(?:ID|id|Id)[:\s]*([A-Za-z0-9]{6,})', re.IGNORECASE),
                method=RedactionMethod.HASH,
                category="internal",
                description="Internal system IDs"
            ),
            RedactionRule(
                pattern=re.compile(r'\b(?:secret|private|confidential)[_-]?(?:key|token|code)[:\s]*([A-Za-z0-9]{8,})', re.IGNORECASE),
                method=RedactionMethod.MASK,
                category="internal",
                description="Secret keys and codes"
            )
        ]
        
        # Assign rules to redaction levels
        
        # MINIMAL: Only the most sensitive data
        self._rules["minimal"] = provider_id_rules + api_key_rules
        
        # STANDARD: Common sensitive data
        self._rules["standard"] = (
            provider_id_rules + api_key_rules + id_rules + 
            [rule for rule in pii_rules if rule.category == "pii"]
        )
        
        # AGGRESSIVE: Most potentially sensitive data
        self._rules["aggressive"] = (
            provider_id_rules + api_key_rules + id_rules + pii_rules + 
            network_rules + financial_rules
        )
        
        # PARANOID: Everything that could be sensitive
        self._rules["paranoid"] = (
            provider_id_rules + api_key_rules + id_rules + pii_rules + 
            network_rules + financial_rules + system_rules
        )
        
        self.logger.info(f"Initialized redaction rules: "
                        f"minimal({len(self._rules['minimal'])}), "
                        f"standard({len(self._rules['standard'])}), "
                        f"aggressive({len(self._rules['aggressive'])}), "
                        f"paranoid({len(self._rules['paranoid'])})")
    
    def redact_text(
        self, 
        text: str, 
        level: RedactionLevel = RedactionLevel.STANDARD,
        custom_rules: Optional[List[RedactionRule]] = None
    ) -> str:
        """
        Redact sensitive information from text
        
        Args:
            text: Text to redact
            level: Redaction level to apply
            custom_rules: Additional custom rules to apply
            
        Returns:
            Redacted text
        """
        if not text:
            return text
        
        redacted_text = text
        rules_to_apply = self._rules.get(level.value, [])
        
        if custom_rules:
            rules_to_apply.extend(custom_rules)
        
        # Apply each redaction rule
        for rule in rules_to_apply:
            matches = list(rule.pattern.finditer(redacted_text))
            if matches:
                self.patterns_matched[rule.description] = self.patterns_matched.get(rule.description, 0) + len(matches)
                
                # Apply redactions in reverse order to maintain positions
                for match in reversed(matches):
                    replacement = rule.apply(redacted_text, match)
                    redacted_text = redacted_text[:match.start()] + replacement + redacted_text[match.end():]
                    self.redactions_performed += 1
        
        return redacted_text
    
    def redact_dict(
        self, 
        data: Dict[str, Any], 
        level: RedactionLevel = RedactionLevel.STANDARD,
        sensitive_keys: Optional[Set[str]] = None
    ) -> Dict[str, Any]:
        """
        Redact sensitive information from dictionary/JSON data
        
        Args:
            data: Dictionary to redact
            level: Redaction level to apply
            sensitive_keys: Set of keys that should always be redacted
            
        Returns:
            Redacted dictionary
        """
        if not data:
            return data
        
        if sensitive_keys is None:
            sensitive_keys = {
                'api_key', 'apikey', 'token', 'password', 'secret', 'private_key',
                'authorization', 'bearer', 'session_id', 'user_id', 'provider_id',
                'prizepicks_id', 'draftkings_id', 'fanduel_id', 'internal_id'
            }
        
        def redact_recursive(obj: Any) -> Any:
            if isinstance(obj, dict):
                redacted = {}
                for key, value in obj.items():
                    # Check if key is sensitive
                    key_lower = key.lower().replace('-', '_').replace(' ', '_')
                    if any(sensitive_key in key_lower for sensitive_key in sensitive_keys):
                        if isinstance(value, str):
                            redacted[key] = self.redact_text(value, level)
                        else:
                            redacted[key] = "[REDACTED]"
                    else:
                        redacted[key] = redact_recursive(value)
                return redacted
            
            elif isinstance(obj, list):
                return [redact_recursive(item) for item in obj]
            
            elif isinstance(obj, str):
                return self.redact_text(obj, level)
            
            else:
                return obj
        
        return redact_recursive(data)
    
    def redact_log_message(
        self, 
        message: str, 
        extra_data: Optional[Dict[str, Any]] = None,
        level: RedactionLevel = RedactionLevel.STANDARD
    ) -> tuple[str, Optional[Dict[str, Any]]]:
        """
        Redact sensitive information from log messages and extra data
        
        Args:
            message: Log message to redact
            extra_data: Extra data dictionary to redact
            level: Redaction level to apply
            
        Returns:
            Tuple of (redacted_message, redacted_extra_data)
        """
        redacted_message = self.redact_text(message, level)
        redacted_extra = None
        
        if extra_data:
            redacted_extra = self.redact_dict(extra_data, level)
        
        return redacted_message, redacted_extra
    
    def redact_rationale_content(
        self, 
        rationale_data: Dict[str, Any],
        level: RedactionLevel = RedactionLevel.MINIMAL
    ) -> Dict[str, Any]:
        """
        Redact sensitive information from rationale content
        
        Args:
            rationale_data: Rationale data to redact
            level: Redaction level to apply (usually MINIMAL for user-facing content)
            
        Returns:
            Redacted rationale data
        """
        # Specific redaction for rationale content
        rationale_sensitive_keys = {
            'provider_id', 'internal_id', 'api_key', 'session_id',
            'prizepicks_id', 'draftkings_id', 'fanduel_id'
        }
        
        redacted = self.redact_dict(rationale_data, level, rationale_sensitive_keys)
        
        # Additional redaction for narrative text
        if 'narrative' in redacted:
            redacted['narrative'] = self.redact_text(redacted['narrative'], level)
        
        if 'key_points' in redacted and isinstance(redacted['key_points'], list):
            redacted['key_points'] = [
                self.redact_text(point, level) if isinstance(point, str) else point
                for point in redacted['key_points']
            ]
        
        # Redact structured sections if present
        if 'structured_sections' in redacted:
            sections = redacted['structured_sections']
            if isinstance(sections, dict):
                for section_key, section_content in sections.items():
                    if isinstance(section_content, str):
                        sections[section_key] = self.redact_text(section_content, level)
        
        return redacted
    
    def add_custom_rule(
        self, 
        pattern: str, 
        method: RedactionMethod,
        level: RedactionLevel,
        replacement: Optional[str] = None,
        category: str = "custom",
        description: str = ""
    ) -> None:
        """Add a custom redaction rule"""
        rule = RedactionRule(
            pattern=re.compile(pattern, re.IGNORECASE),
            method=method,
            replacement=replacement,
            category=category,
            description=description or f"Custom rule: {pattern}"
        )
        
        self._rules[level.value].append(rule)
        self.logger.info(f"Added custom redaction rule for {level.value}: {description}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get redaction service statistics"""
        return {
            "redactions_performed": self.redactions_performed,
            "patterns_matched": dict(self.patterns_matched),
            "rules_by_level": {
                level: len(rules) for level, rules in self._rules.items()
            },
            "top_matched_patterns": sorted(
                self.patterns_matched.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]
        }
    
    def audit_redaction(
        self, 
        original_text: str, 
        level: RedactionLevel = RedactionLevel.STANDARD
    ) -> Dict[str, Any]:
        """
        Perform an audit of what would be redacted from text
        
        Args:
            original_text: Text to audit
            level: Redaction level to simulate
            
        Returns:
            Audit results showing what would be redacted
        """
        audit_results = {
            "original_length": len(original_text),
            "redaction_level": level.value,
            "matches_found": [],
            "total_matches": 0
        }
        
        rules_to_check = self._rules.get(level.value, [])
        
        for rule in rules_to_check:
            matches = list(rule.pattern.finditer(original_text))
            if matches:
                for match in matches:
                    audit_results["matches_found"].append({
                        "rule_description": rule.description,
                        "rule_category": rule.category,
                        "match_text": match.group()[:20] + "..." if len(match.group()) > 20 else match.group(),
                        "match_position": f"{match.start()}-{match.end()}",
                        "redaction_method": rule.method.value,
                        "would_become": rule.apply(original_text, match)[:20] + "..." if len(rule.apply(original_text, match)) > 20 else rule.apply(original_text, match)
                    })
                audit_results["total_matches"] += len(matches)
        
        # Calculate redaction percentage
        redacted_text = self.redact_text(original_text, level)
        audit_results["redacted_length"] = len(redacted_text)
        audit_results["redaction_percentage"] = ((len(original_text) - len(redacted_text)) / len(original_text)) * 100 if original_text else 0
        
        return audit_results


# Global redaction service instance
_redaction_service: Optional[DataRedactionService] = None


def get_redaction_service() -> DataRedactionService:
    """Get the global data redaction service instance"""
    global _redaction_service
    if _redaction_service is None:
        _redaction_service = DataRedactionService()
    return _redaction_service


def redact_for_logging(message: str, extra_data: Optional[Dict[str, Any]] = None) -> tuple[str, Optional[Dict[str, Any]]]:
    """Convenience function for redacting log data"""
    service = get_redaction_service()
    return service.redact_log_message(message, extra_data, RedactionLevel.STANDARD)


def redact_for_user_output(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function for redacting user-facing output"""
    service = get_redaction_service()
    return service.redact_rationale_content(data, RedactionLevel.MINIMAL)