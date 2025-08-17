"""
Local Stub LLM Adapter - Deterministic placeholder for testing and development
"""

import hashlib
import time
from typing import Dict, Any, Optional

from .base_adapter import BaseAdapter, LLMResult
from backend.services.unified_logging import get_logger

logger = get_logger("local_stub_adapter")


class LocalStubAdapter(BaseAdapter):
    """Local stub adapter that provides deterministic pseudo-responses"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.response_templates = {
            "explanation": """This {prop_type} prop for {player_name} shows a {edge_direction} edge. 
The model predicts {prediction:.1f} vs an offered line of {offered_line:.1f}, 
giving an expected value of {ev:+.3f}. Key factors include recent performance trends 
and {volatility_level} volatility ({volatility_score:.2f}). 
Consider the {context_notes} when evaluating this opportunity.""",
            
            "fallback": """Automated explanation for {player_name} {prop_type}: 
Model prediction {prediction:.1f} vs line {offered_line:.1f} 
(EV: {ev:+.3f}, Volatility: {volatility_score:.2f})"""
        }
    
    def is_available(self) -> bool:
        """Local stub is always available"""
        return True
    
    async def generate(
        self,
        prompt: str,
        *,
        max_tokens: int,
        temperature: float,
        timeout: int
    ) -> LLMResult:
        """Generate deterministic pseudo-response based on prompt content"""
        start_time = time.time()
        
        # Simulate processing time (based on prompt length)
        processing_delay = min(0.5 + len(prompt) * 0.001, 2.0)
        await asyncio.sleep(processing_delay)
        
        # Extract key information from prompt
        context = self._extract_context_from_prompt(prompt)
        
        # Generate deterministic response
        content = self._generate_response(context, prompt)
        
        # Sanitize output for logging safety
        sanitized_content = self._sanitize_output(content)
        
        generation_time_ms = int((time.time() - start_time) * 1000)
        tokens_used = self._calculate_token_estimate(prompt)
        
        return LLMResult(
            content=sanitized_content,
            tokens_used=tokens_used,
            provider="local_stub",
            finish_reason="stop",
            generation_time_ms=generation_time_ms,
            model_name="local_stub_v1",
            metadata={
                "prompt_hash": hashlib.sha256(prompt.encode()).hexdigest()[:16],
                "context_extracted": context,
                "processing_delay_ms": int(processing_delay * 1000)
            }
        )
    
    def _extract_context_from_prompt(self, prompt: str) -> Dict[str, Any]:
        """Extract context information from prompt for response generation"""
        context = {
            "player_name": "Player",
            "prop_type": "prop",
            "prediction": 0.0,
            "offered_line": 0.0,
            "ev": 0.0,
            "volatility_score": 0.0,
            "edge_direction": "neutral",
            "volatility_level": "moderate",
            "context_notes": "standard market conditions"
        }
        
        # Simple extraction patterns
        lines = prompt.lower().split('\n')
        for line in lines:
            if 'player:' in line:
                context['player_name'] = line.split('player:', 1)[1].strip().title()
            elif 'prop type:' in line:
                context['prop_type'] = line.split('prop type:', 1)[1].strip()
            elif 'prediction:' in line:
                try:
                    context['prediction'] = float(line.split('prediction:', 1)[1].strip())
                except (ValueError, IndexError):
                    pass
            elif 'offered line:' in line:
                try:
                    context['offered_line'] = float(line.split('offered line:', 1)[1].strip())
                except (ValueError, IndexError):
                    pass
            elif 'expected value:' in line or 'ev:' in line:
                try:
                    value_part = line.split('ev:', 1)[1] if 'ev:' in line else line.split('expected value:', 1)[1]
                    context['ev'] = float(value_part.strip())
                except (ValueError, IndexError):
                    pass
            elif 'volatility:' in line:
                try:
                    context['volatility_score'] = float(line.split('volatility:', 1)[1].strip())
                except (ValueError, IndexError):
                    pass
        
        # Determine edge direction
        if context['ev'] > 0.05:
            context['edge_direction'] = "positive"
        elif context['ev'] < -0.05:
            context['edge_direction'] = "negative"
        
        # Volatility level
        if context['volatility_score'] > 0.7:
            context['volatility_level'] = "high"
        elif context['volatility_score'] < 0.3:
            context['volatility_level'] = "low"
        
        return context
    
    def _generate_response(self, context: Dict[str, Any], prompt: str) -> str:
        """Generate response based on context"""
        try:
            # Use main template if we have good context
            if context['player_name'] != "Player" and context['ev'] != 0.0:
                template = self.response_templates["explanation"]
            else:
                template = self.response_templates["fallback"]
            
            response = template.format(**context)
            
            # Add deterministic variation based on prompt hash
            prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
            hash_int = int(prompt_hash[:8], 16)
            
            if hash_int % 3 == 0:
                response += " Monitor line movement closely."
            elif hash_int % 3 == 1:
                response += " Historical trends support this assessment."
            else:
                response += " Consider correlation with other props."
                
            return response
            
        except (KeyError, ValueError) as e:
            logger.warning(f"Template formatting error: {e}, using fallback")
            return f"Analysis for {context['player_name']}: Model assessment indicates {context['edge_direction']} opportunity with {context['volatility_level']} confidence."
    
    def _sanitize_output(self, content: str) -> str:
        """Sanitize output for logging safety"""
        # Replace problematic characters for logging
        sanitized = content.replace('\n', ' ').replace('\r', ' ')
        # Limit length for safety
        if len(sanitized) > 1000:
            sanitized = sanitized[:997] + "..."
        return sanitized


# Fix import
import asyncio