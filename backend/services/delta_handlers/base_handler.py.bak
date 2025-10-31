"""
Base Delta Handler

Provides abstract interface for handling market data changes and
triggering downstream updates to valuations, edges, and portfolio optimization.
"""

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set
from dataclasses import dataclass
import uuid

from backend.services.unified_logging import get_logger


@dataclass 
class DeltaContext:
    """Context information for delta processing"""
    event_id: str
    provider: str
    prop_id: str
    event_type: str  # "PROP_ADDED", "PROP_UPDATED", "PROP_REMOVED"
    timestamp: datetime
    sport: str = "NBA"  # Add sport dimension with default for backward compatibility
    previous_data: Optional[Dict[str, Any]] = None
    current_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if not self.event_id:
            self.event_id = str(uuid.uuid4())
        
        # Ensure sport is always set (backward compatibility)
        if not hasattr(self, 'sport') or not self.sport:
            self.sport = "NBA"


@dataclass
class ProcessingResult:
    """Result of delta processing"""
    success: bool
    handler_name: str
    processing_time_ms: int
    affected_entities: List[str]
    errors: List[str]
    dependencies_triggered: List[str]
    context: DeltaContext


class BaseDeltaHandler(ABC):
    """Base class for all delta handlers"""
    
    def __init__(self, name: str, dependencies: Optional[List[str]] = None, supported_sports: Optional[List[str]] = None):
        self.name = name
        self.logger = get_logger(f"delta_handler.{name}")
        self.dependencies = dependencies or []
        self.supported_sports = supported_sports or ["NBA"]  # Default to NBA for backward compatibility
        
        # Handler state
        self.is_processing = False
        self.last_processed = None
        self.processing_count = 0
        self.error_count = 0
        
        # Sport-aware processing counts
        self.sport_processing_counts: Dict[str, int] = {}
        self.sport_error_counts: Dict[str, int] = {}
        
        # Dependency tracking
        self.dependency_handlers: Dict[str, 'BaseDeltaHandler'] = {}
        self.waiting_for_dependencies: Set[str] = set()
    
    def supports_sport(self, sport: str) -> bool:
        """Check if handler supports the given sport"""
        return sport in self.supported_sports
        
    @abstractmethod
    async def can_process(self, context: DeltaContext) -> bool:
        """Check if this handler should process the given delta"""
        pass
        
    @abstractmethod
    async def process_delta(self, context: DeltaContext) -> ProcessingResult:
        """Process the delta and return result"""
        pass
        
    async def handle_delta(self, context: DeltaContext) -> Optional[ProcessingResult]:
        """Main entry point for delta handling with dependency management"""
        
        # Check sport support first
        if not self.supports_sport(context.sport):
            self.logger.debug(f"Handler {self.name} does not support sport {context.sport}")
            return None
        
        # Check if we should process this delta
        if not await self.can_process(context):
            return None
            
        # Check dependencies
        if not await self._check_dependencies(context):
            self.logger.debug(f"Dependencies not ready for {context.prop_id} ({context.sport})")
            return None
            
        # Prevent concurrent processing of same handler
        if self.is_processing:
            self.logger.warning(f"Handler {self.name} already processing, skipping delta {context.event_id}")
            return None
            
        self.is_processing = True
        start_time = datetime.utcnow()
        
        try:
            self.logger.debug(f"Processing delta {context.event_type} for {context.prop_id} ({context.sport})")
            
            result = await self.process_delta(context)
            
            # Update handler state
            self.processing_count += 1
            self.last_processed = datetime.utcnow()
            
            # Update sport-specific counts
            if context.sport not in self.sport_processing_counts:
                self.sport_processing_counts[context.sport] = 0
            self.sport_processing_counts[context.sport] += 1
            
            processing_time = int((self.last_processed - start_time).total_seconds() * 1000)
            result.processing_time_ms = processing_time
            
            self.logger.info(
                f"Processed delta {context.event_id} ({context.sport}) in {processing_time}ms, "
                f"affected {len(result.affected_entities)} entities"
            )
            
            # Trigger dependent handlers if needed
            if result.success and result.dependencies_triggered:
                await self._trigger_dependencies(result.dependencies_triggered, context)
            
            return result
            
        except Exception as e:
            self.error_count += 1
            
            # Update sport-specific error counts
            if context.sport not in self.sport_error_counts:
                self.sport_error_counts[context.sport] = 0
            self.sport_error_counts[context.sport] += 1
            
            self.logger.error(f"Error processing delta {context.event_id} ({context.sport}): {e}")
            
            return ProcessingResult(
                success=False,
                handler_name=self.name,
                processing_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
                affected_entities=[],
                errors=[str(e)],
                dependencies_triggered=[],
                context=context
            )
            
        finally:
            self.is_processing = False
            
    async def _check_dependencies(self, context: DeltaContext) -> bool:
        """Check if all dependencies are ready"""
        if not self.dependencies:
            return True
            
        # For now, simple implementation - just check if handlers exist
        # In production, would check if dependent data is ready
        missing_deps = []
        for dep_name in self.dependencies:
            if dep_name not in self.dependency_handlers:
                missing_deps.append(dep_name)
                
        if missing_deps:
            self.logger.debug(f"Missing dependencies: {missing_deps}")
            return False
            
        return True
        
    async def _trigger_dependencies(self, dependency_names: List[str], context: DeltaContext) -> None:
        """Trigger dependent handlers"""
        for dep_name in dependency_names:
            if dep_name in self.dependency_handlers:
                handler = self.dependency_handlers[dep_name]
                self.logger.debug(f"Triggering dependent handler: {dep_name}")
                
                # Schedule dependent handler execution
                asyncio.create_task(handler.handle_delta(context))
            else:
                self.logger.warning(f"Dependent handler not found: {dep_name}")
                
    def register_dependency(self, name: str, handler: 'BaseDeltaHandler') -> None:
        """Register a dependency handler"""
        self.dependency_handlers[name] = handler
        self.logger.debug(f"Registered dependency handler: {name}")
        
    def get_status(self) -> Dict[str, Any]:
        """Get handler status"""
        return {
            "name": self.name,
            "is_processing": self.is_processing,
            "supported_sports": self.supported_sports,
            "last_processed": self.last_processed.isoformat() if self.last_processed else None,
            "processing_count": self.processing_count,
            "error_count": self.error_count,
            "sport_processing_counts": self.sport_processing_counts,
            "sport_error_counts": self.sport_error_counts,
            "dependencies": self.dependencies,
            "registered_dependencies": list(self.dependency_handlers.keys())
        }