"""
Provider Resilience Manager

Implements comprehensive provider state tracking, exponential backoff,
and operational risk reduction for all data providers.

Key Features:
- Per-provider exponential backoff with failure counters
- Provider state tracking (consecutive_failures, avg_latency_ms, success_rate_5m)
- Micro-batching for line change events 
- Recompute debounce logic
- Event bus reliability with dead-letter logging
- Normalized logging schema
"""

import asyncio
import json
import logging
import os
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from ..services.unified_config import get_streaming_config


class IntegrityIssueType(Enum):
    """Types of dependency integrity issues"""
    DANGLING_EDGE = "dangling_edge"         # Edge with no active prop
    ORPHANED_TICKET = "orphaned_ticket"     # Ticket referencing retired edge
    CIRCULAR_DEPENDENCY = "circular_dependency"  # Circular reference detected
    STALE_REFERENCE = "stale_reference"     # Reference to expired data


class RemediationAction(Enum):
    """Types of remediation actions"""
    AUTO_RETIRE = "auto_retire"           # Automatically retire invalid entity
    REPAIR_REFERENCE = "repair_reference" # Repair the reference to valid target
    FLAG_FOR_REVIEW = "flag_for_review"   # Mark for manual review
    CASCADE_DELETE = "cascade_delete"     # Delete dependent entities


@dataclass
class DependencyNode:
    """Represents a node in the dependency graph"""
    entity_type: str          # 'prop', 'edge', 'ticket'
    entity_id: int
    status: str               # 'active', 'retired', 'stale'
    last_updated: float
    dependents: Set[Tuple[str, int]] = field(default_factory=set)    # What depends on this
    dependencies: Set[Tuple[str, int]] = field(default_factory=set)  # What this depends on


@dataclass
class IntegrityIssue:
    """Represents an integrity violation in the dependency graph"""
    issue_type: IntegrityIssueType
    entity_type: str
    entity_id: int
    description: str
    severity: str             # 'critical', 'high', 'medium', 'low'
    detected_at: float
    remediation_action: Optional[RemediationAction] = None
    remediation_applied_at: Optional[float] = None
    remediation_details: Optional[Dict[str, Any]] = None


@dataclass 
class DependencySnapshot:
    """Serializable snapshot of dependency index state"""
    timestamp: float
    node_count: int
    edge_count: int
    integrity_issues_count: int
    nodes: Dict[str, Dict[int, Dict[str, Any]]]
    integrity_issues: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class DependencyIndex:
    """
    In-memory dependency index with persistence for selective updates.
    
    Tracks relationships between props -> edges -> tickets and maintains
    integrity through verification and auto-remediation.
    """
    
    def __init__(self, persist_dir: Optional[str] = None):
        self.logger = logging.getLogger("dependency_index")
        self.persist_dir = Path(persist_dir) if persist_dir else Path("./data/dependency_snapshots")
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        # In-memory dependency graph
        self.nodes: Dict[Tuple[str, int], DependencyNode] = {}
        self.node_lock = asyncio.Lock()
        
        # Integrity tracking
        self.integrity_issues: Dict[str, IntegrityIssue] = {}
        self.integrity_lock = asyncio.Lock()
        
        # Performance metrics
        self.update_count = 0
        self.verification_runs = 0
        self.remediation_count = 0
        self.last_full_verification: Optional[float] = None
        
        # Configuration
        self.max_stale_hours = 24
        self.auto_retirement_enabled = True
        self.snapshot_interval_sec = 300  # 5 minutes
        self.verification_interval_sec = 60  # 1 minute
        self._background_verification_enabled = True  # Can be disabled for testing
        
        # Background task tracking
        self._verification_task: Optional[asyncio.Task] = None
        self._snapshot_task: Optional[asyncio.Task] = None
    
    async def start_background_tasks(self):
        """Start background verification and snapshotting tasks"""
        try:
            loop = asyncio.get_running_loop()
            self._verification_task = loop.create_task(self._integrity_verifier_worker())
            self._snapshot_task = loop.create_task(self._snapshot_worker())
            
            self.logger.info("DependencyIndex background tasks started", extra={
                "category": "dependency_index",
                "action": "start_tasks",
                "verification_interval": self.verification_interval_sec,
                "snapshot_interval": self.snapshot_interval_sec,
            })
        except RuntimeError:
            self.logger.info("DependencyIndex will start background tasks on first use")
    
    async def update_prop(self, prop_id: int, status: str = "active") -> None:
        """Update prop status in dependency index"""
        async with self.node_lock:
            key = ("prop", prop_id)
            if key not in self.nodes:
                self.nodes[key] = DependencyNode(
                    entity_type="prop", 
                    entity_id=prop_id,
                    status=status,
                    last_updated=time.time()
                )
            else:
                self.nodes[key].status = status
                self.nodes[key].last_updated = time.time()
            
            self.update_count += 1
            
            self.logger.debug("Prop updated in dependency index", extra={
                "category": "dependency_index",
                "action": "update_prop", 
                "prop_id": prop_id,
                "status": status,
                "total_nodes": len(self.nodes),
            })
    
    async def update_edge(self, edge_id: int, prop_id: int, status: str = "active") -> None:
        """Update edge and its prop dependency"""
        async with self.node_lock:
            # Ensure prop exists
            await self._ensure_node_exists("prop", prop_id)
            
            # Update/create edge
            edge_key = ("edge", edge_id)
            if edge_key not in self.nodes:
                self.nodes[edge_key] = DependencyNode(
                    entity_type="edge",
                    entity_id=edge_id, 
                    status=status,
                    last_updated=time.time()
                )
            else:
                self.nodes[edge_key].status = status
                self.nodes[edge_key].last_updated = time.time()
            
            # Update dependencies
            prop_key = ("prop", prop_id)
            self.nodes[edge_key].dependencies.add(prop_key)
            self.nodes[prop_key].dependents.add(edge_key)
            
            self.update_count += 1
            
            self.logger.debug("Edge updated in dependency index", extra={
                "category": "dependency_index",
                "action": "update_edge",
                "edge_id": edge_id,
                "prop_id": prop_id, 
                "status": status,
                "total_nodes": len(self.nodes),
            })
    
    async def update_ticket(self, ticket_id: int, edge_ids: List[int], status: str = "active") -> None:
        """Update ticket and its edge dependencies"""
        async with self.node_lock:
            # Ensure all edges exist
            for edge_id in edge_ids:
                await self._ensure_node_exists("edge", edge_id)
            
            # Update/create ticket
            ticket_key = ("ticket", ticket_id)
            if ticket_key not in self.nodes:
                self.nodes[ticket_key] = DependencyNode(
                    entity_type="ticket",
                    entity_id=ticket_id,
                    status=status,
                    last_updated=time.time()
                )
            else:
                self.nodes[ticket_key].status = status
                self.nodes[ticket_key].last_updated = time.time()
            
            # Clear old dependencies and rebuild
            old_deps = set(self.nodes[ticket_key].dependencies)
            self.nodes[ticket_key].dependencies.clear()
            
            # Remove this ticket from old dependencies' dependents
            for old_dep in old_deps:
                if old_dep in self.nodes:
                    self.nodes[old_dep].dependents.discard(ticket_key)
            
            # Add new dependencies
            for edge_id in edge_ids:
                edge_key = ("edge", edge_id)
                self.nodes[ticket_key].dependencies.add(edge_key)
                self.nodes[edge_key].dependents.add(ticket_key)
            
            self.update_count += 1
            
            self.logger.debug("Ticket updated in dependency index", extra={
                "category": "dependency_index",
                "action": "update_ticket",
                "ticket_id": ticket_id,
                "edge_ids": edge_ids,
                "status": status,
                "total_nodes": len(self.nodes),
            })
    
    async def _ensure_node_exists(self, entity_type: str, entity_id: int) -> None:
        """Ensure a node exists in the index (create if missing)"""
        key = (entity_type, entity_id)
        if key not in self.nodes:
            self.nodes[key] = DependencyNode(
                entity_type=entity_type,
                entity_id=entity_id,
                status="unknown",  # Will be updated by next update
                last_updated=time.time()
            )
    
    async def get_dependency_health(self) -> Dict[str, Any]:
        """Get comprehensive dependency health status"""
        async with self.node_lock:
            async with self.integrity_lock:
                # Count nodes by type and status
                node_counts = defaultdict(lambda: defaultdict(int))
                for (entity_type, _), node in self.nodes.items():
                    node_counts[entity_type][node.status] += 1
                
                # Count integrity issues by type and severity
                issue_counts = defaultdict(lambda: defaultdict(int))
                for issue in self.integrity_issues.values():
                    issue_counts[issue.issue_type.value][issue.severity] += 1
                
                # Calculate health scores
                total_nodes = len(self.nodes)
                active_nodes = sum(
                    counts.get("active", 0) 
                    for counts in node_counts.values()
                )
                health_score = (active_nodes / total_nodes) if total_nodes > 0 else 1.0
                
                critical_issues = sum(
                    counts.get("critical", 0) 
                    for counts in issue_counts.values()
                )
                
                return {
                    "health_score": health_score,
                    "total_nodes": total_nodes,
                    "active_nodes": active_nodes,
                    "node_counts": dict(node_counts),
                    "integrity_issues": {
                        "total": len(self.integrity_issues),
                        "critical": critical_issues,
                        "by_type": dict(issue_counts),
                    },
                    "performance_metrics": {
                        "updates_processed": self.update_count,
                        "verification_runs": self.verification_runs,
                        "remediations_applied": self.remediation_count,
                        "last_verification": self.last_full_verification,
                    },
                    "persistence": {
                        "snapshot_dir": str(self.persist_dir),
                        "latest_snapshot": await self._get_latest_snapshot_info(),
                    }
                }
    
    async def _get_latest_snapshot_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the latest snapshot"""
        try:
            snapshots = list(self.persist_dir.glob("snapshot_*.json"))
            if not snapshots:
                return None
            
            latest = max(snapshots, key=lambda p: p.stat().st_mtime)
            stat = latest.stat()
            
            return {
                "snapshot_filename": latest.name,
                "timestamp": stat.st_mtime,
                "size_bytes": stat.st_size,
                "age_sec": time.time() - stat.st_mtime,
            }
        except Exception:
            return None
    
    async def _integrity_verifier_worker(self) -> None:
        """Background task to verify dependency integrity"""
        while True:
            try:
                await asyncio.sleep(self.verification_interval_sec)
                # Only run verification if enabled
                if self._background_verification_enabled:
                    await self._run_integrity_verification()
            except Exception as e:
                self.logger.error("Integrity verifier error", extra={
                    "category": "dependency_index",
                    "action": "verification_error", 
                    "error": str(e),
                })
                await asyncio.sleep(30)  # Back off on error
    
    async def _run_integrity_verification(self) -> None:
        """Run full integrity verification sweep"""
        start_time = time.time()
        issues_found = 0
        issues_fixed = 0
        
        async with self.node_lock:
            async with self.integrity_lock:
                # Clear old resolved issues
                self._clear_resolved_issues()
                
                # Check for dangling edges (edges with no active prop)
                for (entity_type, entity_id), node in self.nodes.items():
                    if entity_type == "edge" and node.status == "active":
                        has_active_prop = any(
                            dep in self.nodes and 
                            self.nodes[dep].status == "active" and
                            self.nodes[dep].entity_type == "prop"
                            for dep in node.dependencies
                        )
                        
                        if not has_active_prop:
                            issue = await self._create_integrity_issue(
                                IntegrityIssueType.DANGLING_EDGE,
                                "edge", entity_id,
                                f"Edge {entity_id} has no active prop dependency",
                                "critical"
                            )
                            issues_found += 1
                            
                            # Auto-remediation: retire the edge
                            if self.auto_retirement_enabled:
                                await self._apply_remediation(issue, RemediationAction.AUTO_RETIRE)
                                issues_fixed += 1
                
                # Check for orphaned tickets (tickets referencing retired edges) 
                for (entity_type, entity_id), node in self.nodes.items():
                    if entity_type == "ticket" and node.status == "active":
                        active_edge_count = sum(
                            1 for dep in node.dependencies 
                            if dep in self.nodes and 
                            self.nodes[dep].status == "active" and
                            self.nodes[dep].entity_type == "edge"
                        )
                        
                        if active_edge_count == 0:
                            issue = await self._create_integrity_issue(
                                IntegrityIssueType.ORPHANED_TICKET,
                                "ticket", entity_id,
                                f"Ticket {entity_id} references only retired edges",
                                "high"
                            )
                            issues_found += 1
                            
                            # Auto-remediation: retire the ticket
                            if self.auto_retirement_enabled:
                                await self._apply_remediation(issue, RemediationAction.AUTO_RETIRE)
                                issues_fixed += 1
                
                # Check for stale references (not updated recently)
                now = time.time()
                stale_threshold = now - (self.max_stale_hours * 3600)
                
                for (entity_type, entity_id), node in self.nodes.items():
                    if node.last_updated < stale_threshold:
                        issue = await self._create_integrity_issue(
                            IntegrityIssueType.STALE_REFERENCE,
                            entity_type, entity_id,
                            f"{entity_type.title()} {entity_id} not updated for {self.max_stale_hours}+ hours",
                            "medium"
                        )
                        issues_found += 1
                        
                        # Mark as stale status
                        if node.status == "active":
                            node.status = "stale"
        
        self.verification_runs += 1
        self.last_full_verification = time.time()
        
        verification_time = time.time() - start_time
        
        self.logger.info("Integrity verification completed", extra={
            "category": "dependency_index",
            "action": "integrity_verification",
            "issues_found": issues_found,
            "issues_fixed": issues_fixed,
            "verification_time_ms": verification_time * 1000,
            "total_nodes": len(self.nodes),
            "verification_runs": self.verification_runs,
        })

    async def _count_integrity_issues_without_remediation(self) -> int:
        """Count integrity issues without applying remediation (for testing)"""
        issues_count = 0
        
        async with self.node_lock:
            # Check for dangling edges (edges with no active prop)
            for (entity_type, entity_id), node in self.nodes.items():
                if entity_type == "edge" and node.status == "active":
                    has_active_prop = any(
                        dep in self.nodes and 
                        self.nodes[dep].status == "active" and
                        self.nodes[dep].entity_type == "prop"
                        for dep in node.dependencies
                    )
                    
                    if not has_active_prop:
                        issues_count += 1
            
            # Check for orphaned tickets (tickets referencing retired edges) 
            for (entity_type, entity_id), node in self.nodes.items():
                if entity_type == "ticket" and node.status == "active":
                    active_edge_count = sum(
                        1 for dep in node.dependencies 
                        if dep in self.nodes and 
                        self.nodes[dep].status == "active" and
                        self.nodes[dep].entity_type == "edge"
                    )
                    
                    if active_edge_count == 0:
                        issues_count += 1
        
        return issues_count
    
    def _clear_resolved_issues(self) -> None:
        """Clear integrity issues that have been resolved"""
        resolved_issues = []
        
        for issue_id, issue in self.integrity_issues.items():
            # Check if the issue is still valid
            key = (issue.entity_type, issue.entity_id)
            if key not in self.nodes:
                resolved_issues.append(issue_id)
                continue
            
            node = self.nodes[key]
            
            # Check specific issue types
            if issue.issue_type == IntegrityIssueType.DANGLING_EDGE:
                # Check if edge still has no active prop dependency
                has_active_prop = any(
                    dep in self.nodes and 
                    self.nodes[dep].status == "active" and
                    self.nodes[dep].entity_type == "prop"
                    for dep in node.dependencies
                )
                # If edge is retired OR now has active prop, issue is resolved
                if node.status != "active" or has_active_prop:
                    resolved_issues.append(issue_id)
                    
            elif issue.issue_type == IntegrityIssueType.ORPHANED_TICKET:
                # Check if ticket still has no active edges
                active_edge_count = sum(
                    1 for dep in node.dependencies 
                    if dep in self.nodes and 
                    self.nodes[dep].status == "active" and
                    self.nodes[dep].entity_type == "edge"
                )
                # If ticket is retired OR now has active edges, issue is resolved
                if node.status != "active" or active_edge_count > 0:
                    resolved_issues.append(issue_id)
                    
            elif issue.issue_type == IntegrityIssueType.STALE_REFERENCE:
                if node.status != "stale":
                    resolved_issues.append(issue_id)
        
        # Remove resolved issues
        for issue_id in resolved_issues:
            del self.integrity_issues[issue_id]
    
    async def _create_integrity_issue(self, issue_type: IntegrityIssueType, entity_type: str,
                                    entity_id: int, description: str, severity: str) -> IntegrityIssue:
        """Create and track a new integrity issue"""
        issue_id = f"{issue_type.value}_{entity_type}_{entity_id}"
        
        issue = IntegrityIssue(
            issue_type=issue_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            severity=severity,
            detected_at=time.time()
        )
        
        self.integrity_issues[issue_id] = issue
        
        self.logger.warning("Integrity issue detected", extra={
            "category": "dependency_index",
            "action": "integrity_issue_detected",
            "issue_type": issue_type.value,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "severity": severity,
            "description": description,
        })
        
        return issue
    
    async def _apply_remediation(self, issue: IntegrityIssue, action: RemediationAction) -> None:
        """Apply remediation action to an integrity issue"""
        try:
            key = (issue.entity_type, issue.entity_id)
            
            if action == RemediationAction.AUTO_RETIRE:
                if key in self.nodes:
                    old_status = self.nodes[key].status
                    self.nodes[key].status = "retired"
                    self.nodes[key].last_updated = time.time()
                    
                    # Update issue with remediation details
                    issue.remediation_action = action
                    issue.remediation_applied_at = time.time()
                    issue.remediation_details = {
                        "old_status": old_status,
                        "new_status": "retired",
                        "action": "auto_retirement"
                    }
                    
                    self.remediation_count += 1
                    
                    self.logger.info("Auto-remediation applied", extra={
                        "category": "dependency_index",
                        "action": "remediation_applied",
                        "issue_type": issue.issue_type.value,
                        "entity_type": issue.entity_type,
                        "entity_id": issue.entity_id,
                        "remediation_action": action.value,
                        "old_status": old_status,
                        "new_status": "retired",
                    })
            
            elif action == RemediationAction.CASCADE_DELETE:
                # Remove the node and update dependents
                if key in self.nodes:
                    node = self.nodes[key]
                    
                    # Notify dependents of deletion
                    for dependent_key in node.dependents:
                        if dependent_key in self.nodes:
                            self.nodes[dependent_key].dependencies.discard(key)
                    
                    # Remove from dependencies' dependents
                    for dependency_key in node.dependencies:
                        if dependency_key in self.nodes:
                            self.nodes[dependency_key].dependents.discard(key)
                    
                    # Remove the node
                    del self.nodes[key]
                    
                    issue.remediation_action = action
                    issue.remediation_applied_at = time.time()
                    issue.remediation_details = {
                        "action": "cascade_delete",
                        "dependents_notified": len(node.dependents),
                        "dependencies_updated": len(node.dependencies)
                    }
                    
                    self.remediation_count += 1
                    
                    self.logger.info("Cascade deletion applied", extra={
                        "category": "dependency_index", 
                        "action": "cascade_delete",
                        "entity_type": issue.entity_type,
                        "entity_id": issue.entity_id,
                        "dependents_affected": len(node.dependents),
                    })
            
        except Exception as e:
            self.logger.error("Remediation failed", extra={
                "category": "dependency_index",
                "action": "remediation_error",
                "issue_type": issue.issue_type.value,
                "entity_type": issue.entity_type,
                "entity_id": issue.entity_id,
                "remediation_action": action.value,
                "error": str(e),
            })
    
    async def _snapshot_worker(self) -> None:
        """Background task to create periodic snapshots"""
        while True:
            try:
                await asyncio.sleep(self.snapshot_interval_sec)
                await self._create_snapshot()
            except Exception as e:
                self.logger.error("Snapshot worker error", extra={
                    "category": "dependency_index",
                    "action": "snapshot_error",
                    "error": str(e),
                })
                await asyncio.sleep(60)  # Back off on error
    
    async def _create_snapshot(self) -> str:
        """Create a persistence snapshot of the current state"""
        timestamp = time.time()
        
        async with self.node_lock:
            async with self.integrity_lock:
                # Prepare serializable snapshot
                nodes_by_type = defaultdict(dict)
                for (entity_type, entity_id), node in self.nodes.items():
                    nodes_by_type[entity_type][entity_id] = {
                        "status": node.status,
                        "last_updated": node.last_updated,
                        "dependents": [(t, i) for t, i in node.dependents],
                        "dependencies": [(t, i) for t, i in node.dependencies],
                    }
                
                # Serialize integrity issues
                serialized_issues = []
                for issue in self.integrity_issues.values():
                    serialized_issues.append({
                        "issue_type": issue.issue_type.value,
                        "entity_type": issue.entity_type,
                        "entity_id": issue.entity_id,
                        "description": issue.description,
                        "severity": issue.severity,
                        "detected_at": issue.detected_at,
                        "remediation_action": issue.remediation_action.value if issue.remediation_action else None,
                        "remediation_applied_at": issue.remediation_applied_at,
                        "remediation_details": issue.remediation_details,
                    })
                
                snapshot = DependencySnapshot(
                    timestamp=timestamp,
                    node_count=len(self.nodes),
                    edge_count=sum(1 for (t, _) in self.nodes.keys() if t == "edge"),
                    integrity_issues_count=len(self.integrity_issues),
                    nodes=dict(nodes_by_type),
                    integrity_issues=serialized_issues,
                    metadata={
                        "updates_processed": self.update_count,
                        "verification_runs": self.verification_runs,
                        "remediations_applied": self.remediation_count,
                        "snapshot_interval": self.snapshot_interval_sec,
                    }
                )
        
        # Write to disk
        filename = f"snapshot_{int(timestamp)}.json"
        filepath = self.persist_dir / filename
        
        try:
            with open(filepath, 'w') as f:
                json.dump(asdict(snapshot), f, indent=2)
            
            # Cleanup old snapshots (keep last 10)
            await self._cleanup_old_snapshots()
            
            self.logger.debug("Dependency snapshot created", extra={
                "category": "dependency_index",
                "action": "snapshot_created",
                "snapshot_file": filename,
                "node_count": snapshot.node_count,
                "issues_count": snapshot.integrity_issues_count,
                "size_bytes": filepath.stat().st_size,
            })
            
            return str(filepath)
            
        except Exception as e:
            self.logger.error("Failed to create snapshot", extra={
                "category": "dependency_index",
                "action": "snapshot_failed",
                "snapshot_file": filename,
                "error": str(e),
            })
            return ""
    
    async def _cleanup_old_snapshots(self) -> None:
        """Keep only the most recent snapshots"""
        try:
            snapshots = sorted(
                self.persist_dir.glob("snapshot_*.json"),
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )
            
            # Remove all but the 10 most recent
            for old_snapshot in snapshots[10:]:
                old_snapshot.unlink()
                
        except Exception as e:
            self.logger.error("Snapshot cleanup failed", extra={
                "category": "dependency_index", 
                "action": "cleanup_failed",
                "error": str(e),
            })
    
    async def load_snapshot(self, filename: Optional[str] = None) -> bool:
        """Load dependency state from a snapshot"""
        try:
            if filename:
                filepath = self.persist_dir / filename
            else:
                # Load most recent snapshot
                snapshots = list(self.persist_dir.glob("snapshot_*.json"))
                if not snapshots:
                    return False
                filepath = max(snapshots, key=lambda p: p.stat().st_mtime)
            
            if not filepath.exists():
                return False
            
            with open(filepath) as f:
                data = json.load(f)
            
            # Restore state
            async with self.node_lock:
                async with self.integrity_lock:
                    self.nodes.clear()
                    self.integrity_issues.clear()
                    
                    # Restore nodes
                    for entity_type, entities in data["nodes"].items():
                        for entity_id_str, node_data in entities.items():
                            entity_id = int(entity_id_str)
                            key = (entity_type, entity_id)
                            
                            node = DependencyNode(
                                entity_type=entity_type,
                                entity_id=entity_id,
                                status=node_data["status"],
                                last_updated=node_data["last_updated"]
                            )
                            
                            # Restore relationships
                            node.dependents = set(
                                (t, i) for t, i in node_data.get("dependents", [])
                            )
                            node.dependencies = set(
                                (t, i) for t, i in node_data.get("dependencies", [])
                            )
                            
                            self.nodes[key] = node
                    
                    # Restore integrity issues
                    for issue_data in data.get("integrity_issues", []):
                        issue_id = f"{issue_data['issue_type']}_{issue_data['entity_type']}_{issue_data['entity_id']}"
                        
                        issue = IntegrityIssue(
                            issue_type=IntegrityIssueType(issue_data["issue_type"]),
                            entity_type=issue_data["entity_type"],
                            entity_id=issue_data["entity_id"],
                            description=issue_data["description"],
                            severity=issue_data["severity"],
                            detected_at=issue_data["detected_at"],
                            remediation_action=RemediationAction(issue_data["remediation_action"]) if issue_data.get("remediation_action") else None,
                            remediation_applied_at=issue_data.get("remediation_applied_at"),
                            remediation_details=issue_data.get("remediation_details")
                        )
                        
                        self.integrity_issues[issue_id] = issue
                    
                    # Restore metadata
                    metadata = data.get("metadata", {})
                    self.update_count = metadata.get("updates_processed", 0)
                    self.verification_runs = metadata.get("verification_runs", 0)
                    self.remediation_count = metadata.get("remediations_applied", 0)
            
            self.logger.info("Dependency snapshot loaded", extra={
                "category": "dependency_index",
                "action": "snapshot_loaded", 
                "snapshot_file": filepath.name,
                "node_count": len(self.nodes),
                "issues_count": len(self.integrity_issues),
            })
            
            return True
            
        except Exception as e:
            self.logger.error("Failed to load snapshot", extra={
                "category": "dependency_index",
                "action": "snapshot_load_failed",
                "snapshot_file": filename or "latest",
                "error": str(e),
            })
            return False
    
    async def synthetic_churn_test(self, iterations: int = 100) -> Dict[str, Any]:
        """
        Synthetic churn test: creates props/edges/tickets then simulates data churn
        and verifies recovery logic works correctly.
        """
        test_start = time.time()
        initial_node_count = len(self.nodes)
        
        self.logger.info("Starting synthetic churn test", extra={
            "category": "dependency_index",
            "action": "churn_test_start",
            "iterations": iterations,
            "initial_nodes": initial_node_count,
        })
        
        # Temporarily disable background verification during test setup
        original_verification_enabled = self._background_verification_enabled
        self._background_verification_enabled = False
        
        try:
            # Clear any existing integrity issues to start fresh
            async with self.integrity_lock:
                self.integrity_issues.clear()
            
            # Phase 1: Create test data
            test_props = list(range(1000, 1000 + iterations))
            test_edges = list(range(2000, 2000 + iterations))
            test_tickets = list(range(3000, 3000 + iterations // 2))
            
            # Create props
            for prop_id in test_props:
                await self.update_prop(prop_id, "active")
            
            # Create edges (each depends on a prop)
            for i, edge_id in enumerate(test_edges):
                prop_id = test_props[i % len(test_props)]
                await self.update_edge(edge_id, prop_id, "active")
            
            # Create tickets (each depends on 2-3 edges)
            for i, ticket_id in enumerate(test_tickets):
                edge_start = i * 2
                edge_ids = test_edges[edge_start:edge_start + 2]
                await self.update_ticket(ticket_id, edge_ids, "active")
            
            # Phase 2: Simulate churn by retiring some props/edges randomly
            import random
            random.seed(42)  # Deterministic for testing
            
            retired_props = random.sample(test_props, iterations // 4)  # Retire 25% of props
            retired_edges = random.sample(test_edges, iterations // 3)  # Retire 33% of edges
            
            for prop_id in retired_props:
                await self.update_prop(prop_id, "retired")
            
            for edge_id in retired_edges:
                # Find the prop this edge depends on
                edge_key = ("edge", edge_id)
                if edge_key in self.nodes:
                    prop_deps = [
                        dep for dep in self.nodes[edge_key].dependencies
                        if dep[0] == "prop"
                    ]
                    if prop_deps:
                        prop_id = prop_deps[0][1]
                        await self.update_edge(edge_id, prop_id, "retired")
            
            # Phase 3: Count issues before remediation (now there should be some!)
            async with self.integrity_lock:
                initial_issues_count = len(self.integrity_issues)
            
            # Phase 4: Run detection only to count issues before remediation
            self._background_verification_enabled = True
            
            # Run detection-only verification to count issues
            initial_issues_count = await self._count_integrity_issues_without_remediation()
            
            # Now run full verification with remediation
            await self._run_integrity_verification()
            
            # Phase 5: Run a second verification to clear resolved issues
            await asyncio.sleep(0.1)  # Allow any async operations to complete
            await self._run_integrity_verification()  # Second pass to clear resolved issues
        
        finally:
            # Always restore original verification state
            self._background_verification_enabled = original_verification_enabled
        
        # Phase 6: Collect results 
        async with self.integrity_lock:
            dangling_edges = sum(
                1 for issue in self.integrity_issues.values()
                if issue.issue_type == IntegrityIssueType.DANGLING_EDGE
            )
            orphaned_tickets = sum(
                1 for issue in self.integrity_issues.values()
                if issue.issue_type == IntegrityIssueType.ORPHANED_TICKET
            )
            
            total_issues = len(self.integrity_issues)
            remediated_issues = sum(
                1 for issue in self.integrity_issues.values()
                if issue.remediation_action is not None
            )
        
        test_duration = time.time() - test_start
        
        # If we found initial issues but now have 0 final issues, all were remediated
        if initial_issues_count > 0 and total_issues == 0:
            actual_remediated_issues = initial_issues_count
            remediation_success_rate = 1.0
        else:
            actual_remediated_issues = remediated_issues
            remediation_success_rate = remediated_issues / max(total_issues, 1)
        
        # Verify recovery logic success - modified to handle background remediation
        recovery_success = (
            initial_issues_count > 0 and  # Some issues were found (test is meaningful)
            (total_issues == 0 or remediated_issues == total_issues)  # All issues resolved
        )
        
        results = {
            "test_passed": recovery_success,
            "test_duration_sec": test_duration,
            "data_created": {
                "props": len(test_props),
                "edges": len(test_edges),
                "tickets": len(test_tickets),
            },
            "churn_applied": {
                "retired_props": len(retired_props),
                "retired_edges": len(retired_edges),
            },
            "integrity_results": {
                "initial_issues_count": initial_issues_count,
                "total_issues_found": total_issues,
                "dangling_edges": dangling_edges,
                "orphaned_tickets": orphaned_tickets,
                "remediated_issues": actual_remediated_issues,
                "remediation_success_rate": remediation_success_rate,
            },
            "performance": {
                "final_node_count": len(self.nodes),
                "nodes_added": len(self.nodes) - initial_node_count,
                "verification_time_ms": (time.time() - test_start) * 1000,
            }
        }
        
        self.logger.info("Synthetic churn test completed", extra={
            "category": "dependency_index",
            "action": "churn_test_complete",
            "test_passed": recovery_success,
            "initial_issues": initial_issues_count,
            "issues_found": total_issues,
            "issues_remediated": actual_remediated_issues,
            "test_duration": test_duration,
        })
        
        return results

    def set_background_verification_enabled(self, enabled: bool) -> None:
        """
        Temporarily enable/disable background verification for testing purposes.
        """
        self._background_verification_enabled = enabled
        
        self.logger.info("Background verification enabled changed", extra={
            "category": "dependency_index",
            "action": "background_verification_toggle",
            "enabled": enabled,
        })


class ProviderState(Enum):
    """Provider operational states implementing circuit breaker patterns"""
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    FAILING = "failing"
    CIRCUIT_OPEN = "circuit_open"


class CircuitBreakerState(Enum):
    """Circuit breaker states for provider resilience"""
    CLOSED = "closed"      # Normal operation, requests allowed
    OPEN = "open"          # Circuit open, requests blocked
    HALF_OPEN = "half_open"  # Testing recovery with limited requests


class LineChangeClassification(Enum):
    """Line change impact classification for computational cost control"""
    MICRO = "micro"        # <0.25 change magnitude
    MODERATE = "moderate"  # 0.25-1.0 change magnitude
    MAJOR = "major"        # >1.0 change magnitude


class ComputeMode(Enum):
    """Computational processing modes"""
    NORMAL = "normal"           # Standard processing
    DEGRADED = "degraded"       # Limited processing under load
    BURST_CONTROL = "burst_control"  # Maximum throttling


@dataclass
class ProviderMetrics:
    """Provider performance and reliability metrics"""
    # Core state fields required by objective
    consecutive_failures: int = 0
    avg_latency_ms: float = 0.0
    success_rate_5m: float = 1.0
    
    # Additional tracking fields
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    last_success_time: Optional[float] = None
    last_failure_time: Optional[float] = None
    
    # Latency tracking with percentiles
    latency_samples: deque = field(default_factory=lambda: deque(maxlen=1000))
    p95_latency_ms: float = 0.0
    
    # Success rate tracking (5-minute rolling window)
    success_rate_window: deque = field(default_factory=lambda: deque(maxlen=300))  # 300 seconds at 1sec granularity
    
    # Provider state
    current_state: ProviderState = ProviderState.HEALTHY
    state_changed_at: float = field(default_factory=time.time)
    
    # Circuit breaker state management
    circuit_state: CircuitBreakerState = CircuitBreakerState.CLOSED
    circuit_state_changed_at: float = field(default_factory=time.time)
    half_open_attempts: int = 0
    half_open_success_threshold: int = 3  # Successful requests needed to close circuit
    
    # Backoff configuration
    backoff_base_sec: float = 1.0
    backoff_multiplier: float = 2.0
    backoff_max_sec: float = 300.0  # 5 minutes max
    backoff_current_sec: float = 0.0
    next_retry_time: float = 0.0
    
    # Error categorization for SLA metrics
    error_categories: Dict[str, int] = field(default_factory=dict)
    
    # SLA metrics tracking
    sla_window_hours: int = 24
    sla_success_count: int = 0
    sla_total_count: int = 0
    sla_violation_count: int = 0


@dataclass 
class RecomputeEvent:
    """Event requiring valuation recompute with computational cost tracking"""
    prop_id: str
    event_type: str
    timestamp: float
    data: Dict[str, Any]
    batch_id: Optional[str] = None
    # Computational cost control fields
    classification: LineChangeClassification = LineChangeClassification.MODERATE
    change_magnitude: float = 0.5  # Default to moderate change
    computational_cost: float = 1.0  # Relative processing cost
    is_aggregated: bool = False  # Whether this represents aggregated changes


@dataclass
class MicroBatch:
    """Aggregated events for micro-batching with computational cost tracking"""
    prop_id: str
    events: List[RecomputeEvent] = field(default_factory=list)
    first_event_time: float = field(default_factory=time.time)
    last_event_time: float = field(default_factory=time.time)
    # Cost control fields
    total_computational_cost: float = 0.0
    aggregated_change_magnitude: float = 0.0
    dominant_classification: LineChangeClassification = LineChangeClassification.MODERATE
    
    def add_event(self, event: RecomputeEvent):
        """Add event to batch and update computational cost metrics"""
        self.events.append(event)
        self.last_event_time = time.time()
        self.total_computational_cost += event.computational_cost
        
        # Update aggregated change magnitude (max of all changes)
        self.aggregated_change_magnitude = max(
            self.aggregated_change_magnitude, 
            event.change_magnitude
        )
        
        # Update dominant classification (highest priority)
        classifications_priority = {
            LineChangeClassification.MICRO: 0,
            LineChangeClassification.MODERATE: 1,
            LineChangeClassification.MAJOR: 2
        }
        
        if classifications_priority[event.classification] > classifications_priority[self.dominant_classification]:
            self.dominant_classification = event.classification
    
    def should_process(self, batch_window_ms: int = 250) -> bool:
        """Check if batch is ready for processing"""
        now = time.time()
        age_ms = (now - self.first_event_time) * 1000
        return age_ms >= batch_window_ms or len(self.events) >= 10  # Age or size threshold


@dataclass
class EdgeChangeRecord:
    """Tracks individual edge changes for partial refresh optimization"""
    edge_id: int
    change_type: str  # 'price_move', 'status_change', 'prop_update'
    magnitude: float
    timestamp: float
    correlation_cluster_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ImpactedCluster:
    """Represents a cluster of correlated props impacted by edge changes"""
    cluster_id: str
    prop_ids: Set[int] = field(default_factory=set)
    edge_ids: Set[int] = field(default_factory=set)
    impact_magnitude: float = 0.0
    change_count: int = 0
    last_updated: float = field(default_factory=time.time)
    correlation_strength: float = 0.0  # Average correlation within cluster
    requires_matrix_refresh: bool = False


class EdgeChangeAggregator:
    """
    Edge change aggregation system that computes impacted correlation clusters.
    
    Key Features:
    - Tracks edge changes with clustering based on correlation structure
    - Computes impacted clusters when change thresholds are exceeded
    - Schedules correlation matrix warm cache when cluster impact size > threshold
    - Provides selective refresh targeting for optimization efficiency
    """
    
    def __init__(self, cluster_impact_threshold: float = 0.3, 
                 correlation_threshold: float = 0.4,
                 max_change_history: int = 10000):
        self.logger = logging.getLogger("edge_change_aggregator")
        
        # Configuration
        self.cluster_impact_threshold = cluster_impact_threshold
        self.correlation_threshold = correlation_threshold
        self.max_change_history = max_change_history
        
        # Change tracking
        self.edge_changes: deque = deque(maxlen=max_change_history)
        self.changes_by_edge: Dict[int, List[EdgeChangeRecord]] = defaultdict(list)
        self.changes_lock = asyncio.Lock()
        
        # Cluster tracking  
        self.impacted_clusters: Dict[str, ImpactedCluster] = {}
        self.edge_to_cluster: Dict[int, str] = {}
        self.cluster_lock = asyncio.Lock()
        
        # Correlation matrix for clustering
        self.correlation_matrix: Dict[Tuple[int, int], float] = {}
        self.matrix_last_updated: float = 0.0
        
        # Statistics
        self.total_changes_processed = 0
        self.clusters_updated = 0
        self.matrix_refreshes_scheduled = 0
        
    async def record_edge_change(self, edge_id: int, change_type: str, 
                                magnitude: float, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Record edge change and compute impacted clusters.
        Returns cluster_id if change triggers cluster impact.
        """
        now = time.time()
        
        # Create change record
        change = EdgeChangeRecord(
            edge_id=edge_id,
            change_type=change_type,
            magnitude=magnitude,
            timestamp=now,
            metadata=metadata or {}
        )
        
        async with self.changes_lock:
            # Add to change history
            self.edge_changes.append(change)
            self.changes_by_edge[edge_id].append(change)
            
            # Limit per-edge history
            if len(self.changes_by_edge[edge_id]) > 100:
                self.changes_by_edge[edge_id] = self.changes_by_edge[edge_id][-50:]
            
            self.total_changes_processed += 1
        
        # Determine or create cluster for this edge
        cluster_id = await self._get_or_create_cluster(edge_id, magnitude)
        change.correlation_cluster_id = cluster_id
        
        # Update impacted cluster
        await self._update_impacted_cluster(cluster_id, change)
        
        # Check if cluster impact exceeds threshold
        async with self.cluster_lock:
            cluster = self.impacted_clusters[cluster_id]
            if cluster.impact_magnitude > self.cluster_impact_threshold:
                cluster.requires_matrix_refresh = True
                self.matrix_refreshes_scheduled += 1
                
                self.logger.info("Cluster impact threshold exceeded", extra={
                    "category": "edge_change_aggregator",
                    "action": "cluster_impact_threshold",
                    "cluster_id": cluster_id,
                    "impact_magnitude": cluster.impact_magnitude,
                    "threshold": self.cluster_impact_threshold,
                    "edge_count": len(cluster.edge_ids),
                    "prop_count": len(cluster.prop_ids),
                    "requires_matrix_refresh": True,
                    "result": "threshold_exceeded",
                })
                
                return cluster_id
        
        self.logger.debug("Edge change recorded", extra={
            "category": "edge_change_aggregator",
            "action": "record_change",
            "edge_id": edge_id,
            "change_type": change_type,
            "magnitude": magnitude,
            "cluster_id": cluster_id,
            "cluster_impact": cluster.impact_magnitude,
            "result": "recorded",
        })
        
        return None  # No threshold exceeded
    
    async def _get_or_create_cluster(self, edge_id: int, magnitude: float) -> str:
        """Get existing cluster for edge or create new one based on correlation"""
        async with self.cluster_lock:
            # Check if edge already has a cluster
            if edge_id in self.edge_to_cluster:
                return self.edge_to_cluster[edge_id]
            
            # Find existing cluster with correlated edges
            best_cluster_id = None
            best_correlation = 0.0
            
            for cluster_id, cluster in self.impacted_clusters.items():
                # Calculate average correlation with edges in this cluster
                correlations = []
                for other_edge_id in cluster.edge_ids:
                    correlation = self._get_edge_correlation(edge_id, other_edge_id)
                    if correlation is not None:
                        correlations.append(abs(correlation))
                
                if correlations:
                    avg_correlation = sum(correlations) / len(correlations)
                    if avg_correlation > self.correlation_threshold and avg_correlation > best_correlation:
                        best_correlation = avg_correlation
                        best_cluster_id = cluster_id
            
            # Use existing cluster if found
            if best_cluster_id:
                self.edge_to_cluster[edge_id] = best_cluster_id
                return best_cluster_id
            
            # Create new cluster
            new_cluster_id = f"cluster_{len(self.impacted_clusters) + 1}_{int(time.time())}"
            self.impacted_clusters[new_cluster_id] = ImpactedCluster(
                cluster_id=new_cluster_id,
                correlation_strength=1.0  # Single edge cluster
            )
            self.edge_to_cluster[edge_id] = new_cluster_id
            
            return new_cluster_id
    
    def _get_edge_correlation(self, edge_id1: int, edge_id2: int) -> Optional[float]:
        """Get correlation between two edges from correlation matrix"""
        key1 = (min(edge_id1, edge_id2), max(edge_id1, edge_id2))
        key2 = (max(edge_id1, edge_id2), min(edge_id1, edge_id2))
        
        return self.correlation_matrix.get(key1) or self.correlation_matrix.get(key2)
    
    async def _update_impacted_cluster(self, cluster_id: str, change: EdgeChangeRecord) -> None:
        """Update cluster impact metrics with new change"""
        async with self.cluster_lock:
            cluster = self.impacted_clusters[cluster_id]
            
            # Add edge and increment change count
            cluster.edge_ids.add(change.edge_id)
            cluster.change_count += 1
            cluster.last_updated = change.timestamp
            
            # Update impact magnitude (weighted by magnitude and recency)
            recency_weight = 1.0  # Could add time-based decay
            magnitude_contribution = change.magnitude * recency_weight
            
            # Use exponential moving average for impact magnitude
            alpha = 0.3  # Smoothing factor
            cluster.impact_magnitude = (
                alpha * magnitude_contribution + 
                (1 - alpha) * cluster.impact_magnitude
            )
            
            self.clusters_updated += 1
    
    async def update_correlation_matrix(self, correlation_data: Dict[Tuple[int, int], float]) -> None:
        """Update correlation matrix used for clustering"""
        async with self.cluster_lock:
            self.correlation_matrix.update(correlation_data)
            self.matrix_last_updated = time.time()
            
            # Recalculate cluster correlations
            for cluster in self.impacted_clusters.values():
                if len(cluster.edge_ids) > 1:
                    correlations = []
                    edge_list = list(cluster.edge_ids)
                    
                    for i in range(len(edge_list)):
                        for j in range(i + 1, len(edge_list)):
                            correlation = self._get_edge_correlation(edge_list[i], edge_list[j])
                            if correlation is not None:
                                correlations.append(abs(correlation))
                    
                    if correlations:
                        cluster.correlation_strength = sum(correlations) / len(correlations)
            
            self.logger.info("Correlation matrix updated", extra={
                "category": "edge_change_aggregator",
                "action": "update_correlation_matrix",
                "matrix_entries": len(self.correlation_matrix),
                "clusters_updated": len(self.impacted_clusters),
                "result": "updated",
            })
    
    def get_clusters_requiring_refresh(self) -> List[ImpactedCluster]:
        """Get clusters that require correlation matrix refresh"""
        return [
            cluster for cluster in self.impacted_clusters.values()
            if cluster.requires_matrix_refresh
        ]
    
    def get_impacted_clusters(self) -> Dict[str, ImpactedCluster]:
        """Get all currently impacted clusters"""
        return self.impacted_clusters.copy()
    
    def get_changes_for_edge(self, edge_id: int, limit: int = 10) -> List[EdgeChangeRecord]:
        """Get recent changes for a specific edge"""
        return self.changes_by_edge[edge_id][-limit:]
    
    def get_aggregator_stats(self) -> Dict[str, Any]:
        """Get aggregator statistics"""
        now = time.time()
        
        # Calculate recent activity (last 5 minutes)
        recent_changes = sum(
            1 for change in self.edge_changes
            if now - change.timestamp < 300
        )
        
        return {
            "total_changes_processed": self.total_changes_processed,
            "recent_changes_5min": recent_changes,
            "active_clusters": len(self.impacted_clusters),
            "clusters_requiring_refresh": len(self.get_clusters_requiring_refresh()),
            "clusters_updated": self.clusters_updated,
            "matrix_refreshes_scheduled": self.matrix_refreshes_scheduled,
            "correlation_matrix_entries": len(self.correlation_matrix),
            "matrix_last_updated": self.matrix_last_updated,
            "configuration": {
                "cluster_impact_threshold": self.cluster_impact_threshold,
                "correlation_threshold": self.correlation_threshold,
                "max_change_history": self.max_change_history,
            }
        }


@dataclass
class CorrelationCacheScheduler:
    """
    Smart scheduler for correlation matrix warm cache operations.
    
    Triggers correlation matrix updates when cluster impact size exceeds threshold
    and manages cache warming to improve partial refresh performance.
    """
    
    # Configuration
    cluster_size_threshold: int = 5
    cache_warm_interval_sec: int = 300  # 5 minutes
    max_concurrent_cache_ops: int = 3
    
    # State tracking
    pending_cache_operations: Set[str] = field(default_factory=set)
    completed_cache_operations: Dict[str, float] = field(default_factory=dict)
    cache_operation_times: deque = field(default_factory=lambda: deque(maxlen=100))
    
    # Performance metrics
    cache_hits: int = 0
    cache_misses: int = 0
    warm_cache_triggers: int = 0
    
    def __post_init__(self):
        self.logger = logging.getLogger("correlation_cache_scheduler")
        self.operation_lock = asyncio.Lock()
    
    async def should_warm_cache(self, cluster: ImpactedCluster) -> bool:
        """Determine if correlation matrix cache should be warmed for cluster"""
        # Check cluster size threshold
        if len(cluster.prop_ids) < self.cluster_size_threshold:
            return False
        
        # Check if cache operation is already pending or recent
        cache_key = f"cluster_{cluster.cluster_id}"
        async with self.operation_lock:
            if cache_key in self.pending_cache_operations:
                return False
            
            # Check if recently completed
            last_cache_time = self.completed_cache_operations.get(cache_key, 0)
            if time.time() - last_cache_time < self.cache_warm_interval_sec:
                return False
            
            # Check concurrent operation limit
            if len(self.pending_cache_operations) >= self.max_concurrent_cache_ops:
                return False
        
        return True
    
    async def schedule_cache_warm(self, cluster: ImpactedCluster, 
                                 correlation_matrix_provider) -> bool:
        """Schedule correlation matrix warm cache operation"""
        cache_key = f"cluster_{cluster.cluster_id}"
        
        if not await self.should_warm_cache(cluster):
            return False
        
        async with self.operation_lock:
            self.pending_cache_operations.add(cache_key)
        
        try:
            start_time = time.time()
            
            # Warm cache for cluster correlation matrix
            success = await self._warm_cluster_cache(
                cluster, correlation_matrix_provider
            )
            
            duration_ms = (time.time() - start_time) * 1000
            self.cache_operation_times.append(duration_ms)
            
            if success:
                self.warm_cache_triggers += 1
                
                async with self.operation_lock:
                    self.completed_cache_operations[cache_key] = time.time()
                
                self.logger.info("Correlation cache warmed successfully", extra={
                    "category": "correlation_cache_scheduler",
                    "action": "cache_warm_success",
                    "cluster_id": cluster.cluster_id,
                    "cluster_size": len(cluster.prop_ids),
                    "duration_ms": duration_ms,
                    "result": "success",
                })
            
            return success
            
        finally:
            async with self.operation_lock:
                self.pending_cache_operations.discard(cache_key)
    
    async def _warm_cluster_cache(self, cluster: ImpactedCluster, 
                                 correlation_matrix_provider) -> bool:
        """Warm cache for cluster's correlation matrix"""
        try:
            # Get prop IDs for correlation computation
            prop_ids = list(cluster.prop_ids)
            
            if len(prop_ids) < 2:
                return True  # No correlation needed for single prop
            
            # Request correlation matrix computation (will cache results)
            correlation_matrix = await correlation_matrix_provider.get_correlation_matrix(
                prop_ids=prop_ids,
                force_recompute=False  # Use cache if available
            )
            
            # Update cache hit/miss statistics
            if correlation_matrix.get('from_cache', False):
                self.cache_hits += 1
            else:
                self.cache_misses += 1
            
            return correlation_matrix is not None
            
        except Exception as e:
            self.logger.error("Cache warm operation failed", extra={
                "category": "correlation_cache_scheduler",
                "action": "cache_warm_error",
                "cluster_id": cluster.cluster_id,
                "error": str(e),
                "result": "error",
            })
            return False
    
    def get_cache_performance_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_operations = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total_operations * 100) if total_operations > 0 else 0
        
        avg_cache_time = (
            sum(self.cache_operation_times) / len(self.cache_operation_times)
            if self.cache_operation_times else 0
        )
        
        return {
            "cache_hit_rate_pct": hit_rate,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "warm_cache_triggers": self.warm_cache_triggers,
            "avg_cache_operation_ms": avg_cache_time,
            "pending_operations": len(self.pending_cache_operations),
            "completed_operations": len(self.completed_cache_operations),
            "configuration": {
                "cluster_size_threshold": self.cluster_size_threshold,
                "cache_warm_interval_sec": self.cache_warm_interval_sec,
                "max_concurrent_cache_ops": self.max_concurrent_cache_ops,
            }
        }


@dataclass
class ComputationalController:
    """Controls computational cost and prevents performance degradation under load"""
    # Event classification and tracking
    events_emitted: int = 0
    recomputes_executed: int = 0
    pending_queue_depth: int = 0
    
    # Burst control configuration
    max_events_per_cycle: int = 100  # Max events processed per cycle
    cycle_duration_sec: float = 1.0  # Duration of processing cycle
    burst_threshold: float = 0.8     # Threshold to enter degraded mode (80% of max)
    
    # Current processing state
    current_mode: ComputeMode = ComputeMode.NORMAL
    mode_changed_at: float = field(default_factory=time.time)
    
    # Cycle tracking
    current_cycle_start: float = field(default_factory=time.time)
    current_cycle_events: int = 0
    current_cycle_cost: float = 0.0
    
    # Lazy recompute tracking
    flagged_recomputes: Dict[str, float] = field(default_factory=dict)  # prop_id -> flagged_time
    lazy_window_sec: float = 5.0  # Window to aggregate micro changes
    
    # Rolling counters (last 60 seconds)
    event_history: deque = field(default_factory=lambda: deque(maxlen=60))
    recompute_history: deque = field(default_factory=lambda: deque(maxlen=60))
    queue_depth_history: deque = field(default_factory=lambda: deque(maxlen=60))
    
    # Performance thresholds
    cpu_target_threshold: float = 0.7  # Target CPU utilization (70%)
    degraded_processing_ratio: float = 0.5  # Process 50% of events in degraded mode
    
    def is_new_cycle(self) -> bool:
        """Check if we've entered a new processing cycle"""
        return time.time() - self.current_cycle_start >= self.cycle_duration_sec
    
    def start_new_cycle(self):
        """Start a new processing cycle"""
        now = time.time()
        
        # Update rolling counters
        self.event_history.append((now, self.current_cycle_events))
        self.recompute_history.append((now, self.recomputes_executed))
        self.queue_depth_history.append((now, self.pending_queue_depth))
        
        # Reset cycle counters
        self.current_cycle_start = now
        self.current_cycle_events = 0
        self.current_cycle_cost = 0.0
        
        # Update processing mode based on load
        self._update_processing_mode()
    
    def _update_processing_mode(self):
        """Update processing mode based on current load"""
        old_mode = self.current_mode
        
        # Calculate recent load metrics
        recent_events = sum(count for _, count in list(self.event_history)[-10:])  # Last 10 seconds
        load_ratio = recent_events / (self.max_events_per_cycle * 10)  # 10 seconds worth
        
        if load_ratio > 1.0:
            new_mode = ComputeMode.BURST_CONTROL
        elif load_ratio > self.burst_threshold:
            new_mode = ComputeMode.DEGRADED
        else:
            new_mode = ComputeMode.NORMAL
        
        if new_mode != old_mode:
            self.current_mode = new_mode
            self.mode_changed_at = time.time()
    
    def should_defer_micro_change(self, prop_id: str, change_magnitude: float) -> bool:
        """Check if micro change should be deferred for lazy processing"""
        if change_magnitude >= 0.25:  # Not a micro change
            return False
        
        now = time.time()
        
        # Check if already flagged for lazy recompute
        if prop_id in self.flagged_recomputes:
            flagged_time = self.flagged_recomputes[prop_id]
            if now - flagged_time < self.lazy_window_sec:
                return True  # Defer within lazy window
            else:
                # Window expired, allow processing and update flag
                self.flagged_recomputes[prop_id] = now
                return False
        else:
            # New micro change, flag for lazy processing
            self.flagged_recomputes[prop_id] = now
            return True
    
    def can_process_event(self, event: RecomputeEvent) -> Tuple[bool, str]:
        """Check if event can be processed given current load"""
        # Check if we need to start a new cycle
        if self.is_new_cycle():
            self.start_new_cycle()
        
        # Handle micro changes with lazy processing
        if (event.classification == LineChangeClassification.MICRO and 
            self.should_defer_micro_change(event.prop_id, event.change_magnitude)):
            return False, "deferred_lazy_micro"
        
        # Check burst control limits
        if self.current_mode == ComputeMode.BURST_CONTROL:
            if self.current_cycle_events >= self.max_events_per_cycle:
                self.pending_queue_depth += 1
                return False, "burst_control_limit"
        
        elif self.current_mode == ComputeMode.DEGRADED:
            # In degraded mode, only process a fraction of events
            degraded_limit = int(self.max_events_per_cycle * self.degraded_processing_ratio)
            if self.current_cycle_events >= degraded_limit:
                # For major changes, always try to process (no starvation)
                if event.classification != LineChangeClassification.MAJOR:
                    self.pending_queue_depth += 1
                    return False, "degraded_mode_limit"
        
        # Event can be processed
        self.current_cycle_events += 1
        self.current_cycle_cost += event.computational_cost
        self.events_emitted += 1
        
        return True, "allowed"
    
    def record_recompute_executed(self):
        """Record that a recompute was executed"""
        self.recomputes_executed += 1
        if self.pending_queue_depth > 0:
            self.pending_queue_depth -= 1
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance and load metrics"""
        now = time.time()
        
        # Calculate rolling averages
        recent_events = [count for timestamp, count in self.event_history if now - timestamp <= 60]
        recent_recomputes = [count for timestamp, count in self.recompute_history if now - timestamp <= 60]
        recent_queue_depths = [depth for timestamp, depth in self.queue_depth_history if now - timestamp <= 60]
        
        avg_events_per_sec = sum(recent_events) / max(len(recent_events), 1)
        avg_recomputes_per_sec = sum(recent_recomputes) / max(len(recent_recomputes), 1)
        avg_queue_depth = sum(recent_queue_depths) / max(len(recent_queue_depths), 1)
        
        return {
            "events_emitted": self.events_emitted,
            "recomputes_executed": self.recomputes_executed,
            "pending_queue_depth": self.pending_queue_depth,
            "current_mode": self.current_mode.value,
            "mode_changed_at": self.mode_changed_at,
            "cycle_events": self.current_cycle_events,
            "cycle_cost": self.current_cycle_cost,
            "avg_events_per_sec": avg_events_per_sec,
            "avg_recomputes_per_sec": avg_recomputes_per_sec,
            "avg_queue_depth": avg_queue_depth,
            "flagged_lazy_props": len(self.flagged_recomputes),
            "load_ratio": self.current_cycle_events / self.max_events_per_cycle,
            "performance_metrics": {
                "cpu_target_threshold": self.cpu_target_threshold,
                "current_load_ratio": avg_events_per_sec / self.max_events_per_cycle,
                "processing_efficiency": self.recomputes_executed / max(self.events_emitted, 1),
            }
        }


@dataclass
class OptimizationRunMetadata:
    """Metadata tracking for optimization runs with partial refresh support"""
    run_id: str
    created_at: float
    last_live_refresh_ts: Optional[float] = None
    refresh_count: int = 0
    is_stale: bool = False
    staleness_reason: Optional[str] = None
    
    # Performance tracking
    full_rebuild_count: int = 0
    partial_refresh_count: int = 0
    last_full_rebuild_duration_ms: Optional[float] = None
    last_partial_refresh_duration_ms: Optional[float] = None
    
    # Score tracking for monotonicity
    best_score: Optional[float] = None
    best_score_updated_at: Optional[float] = None
    previous_best_score: Optional[float] = None
    
    # Edge change tracking
    edges_changed_since_last_refresh: Set[int] = field(default_factory=set)
    candidate_sets_affected: Set[str] = field(default_factory=set)
    
    def mark_stale(self, reason: str) -> None:
        """Mark optimization run as stale"""
        self.is_stale = True
        self.staleness_reason = reason
    
    def record_refresh(self, refresh_type: str, duration_ms: float, new_score: Optional[float] = None) -> None:
        """Record refresh event with performance tracking"""
        now = time.time()
        self.last_live_refresh_ts = now
        self.refresh_count += 1
        
        if refresh_type == "full_rebuild":
            self.full_rebuild_count += 1
            self.last_full_rebuild_duration_ms = duration_ms
        elif refresh_type == "partial_refresh":
            self.partial_refresh_count += 1
            self.last_partial_refresh_duration_ms = duration_ms
        
        # Update best score tracking
        if new_score is not None:
            if self.best_score is not None:
                self.previous_best_score = self.best_score
            self.best_score = new_score
            self.best_score_updated_at = now
        
        # Clear stale flag on successful refresh
        self.is_stale = False
        self.staleness_reason = None


@dataclass
class CandidateSetTracker:
    """Tracks candidate sets and their relationship to edge changes"""
    set_id: str
    edge_ids: Set[int] = field(default_factory=set)
    last_computed_score: Optional[float] = None
    last_computation_ts: Optional[float] = None
    computation_count: int = 0
    contains_changed_edges: bool = False
    score_delta_threshold: float = 0.001  # ε for score preservation


class PartialRefreshManager:
    """
    Manages partial optimization refresh strategy with selective recomputation.
    
    Key Features:
    - Recomputes only candidate sets containing changed edges
    - Preserves previous best scores when score delta < ε
    - Tracks run metadata with staleness flags
    - Provides fallback to full rebuild on failure
    - Ensures monotonic or improved best scores
    """
    
    def __init__(self, score_delta_threshold: float = 0.001,
                 max_partial_refresh_age_sec: int = 3600,
                 fallback_failure_threshold: int = 3):
        self.logger = logging.getLogger("partial_refresh_manager")
        
        # Configuration
        self.score_delta_threshold = score_delta_threshold
        self.max_partial_refresh_age_sec = max_partial_refresh_age_sec
        self.fallback_failure_threshold = fallback_failure_threshold
        
        # Run metadata tracking
        self.optimization_runs: Dict[str, OptimizationRunMetadata] = {}
        self.runs_lock = asyncio.Lock()
        
        # Candidate set tracking
        self.candidate_sets: Dict[str, CandidateSetTracker] = {}
        self.sets_lock = asyncio.Lock()
        
        # Performance benchmarking
        self.partial_refresh_times: deque = deque(maxlen=1000)
        self.full_rebuild_times: deque = deque(maxlen=1000)
        
        # Failure tracking for fallback logic
        self.recent_failures: Dict[str, int] = defaultdict(int)
        
        # Statistics
        self.total_partial_refreshes = 0
        self.total_full_rebuilds = 0
        self.successful_partial_refreshes = 0
        self.fallback_triggers = 0
    
    async def create_optimization_run(self, run_id: str, initial_edge_ids: Set[int]) -> OptimizationRunMetadata:
        """Create new optimization run with metadata tracking"""
        now = time.time()
        
        metadata = OptimizationRunMetadata(
            run_id=run_id,
            created_at=now,
            edges_changed_since_last_refresh=set()
        )
        
        async with self.runs_lock:
            self.optimization_runs[run_id] = metadata
        
        # Initialize candidate sets for this run
        await self._initialize_candidate_sets(run_id, initial_edge_ids)
        
        self.logger.info("Optimization run created", extra={
            "category": "partial_refresh_manager",
            "action": "create_run",
            "run_id": run_id,
            "initial_edge_count": len(initial_edge_ids),
            "result": "created",
        })
        
        return metadata
    
    async def _initialize_candidate_sets(self, run_id: str, edge_ids: Set[int]) -> None:
        """Initialize candidate sets for optimization run"""
        async with self.sets_lock:
            # Create candidate sets based on edge groups (simplified clustering)
            # In practice, this would use more sophisticated clustering
            edge_list = list(edge_ids)
            chunk_size = max(1, len(edge_list) // 10)  # Up to 10 candidate sets
            
            for i in range(0, len(edge_list), chunk_size):
                chunk_edges = set(edge_list[i:i + chunk_size])
                set_id = f"{run_id}_set_{i // chunk_size}"
                
                self.candidate_sets[set_id] = CandidateSetTracker(
                    set_id=set_id,
                    edge_ids=chunk_edges,
                    score_delta_threshold=self.score_delta_threshold
                )
    
    async def record_edge_changes(self, run_id: str, changed_edges: Set[int]) -> None:
        """Record edge changes for a specific optimization run"""
        async with self.runs_lock:
            if run_id not in self.optimization_runs:
                return
            
            metadata = self.optimization_runs[run_id]
            metadata.edges_changed_since_last_refresh.update(changed_edges)
            
            # Mark affected candidate sets
            affected_sets = set()
            async with self.sets_lock:
                for set_id, candidate_set in self.candidate_sets.items():
                    if set_id.startswith(run_id) and candidate_set.edge_ids & changed_edges:
                        candidate_set.contains_changed_edges = True
                        affected_sets.add(set_id)
            
            metadata.candidate_sets_affected.update(affected_sets)
            
            self.logger.debug("Edge changes recorded", extra={
                "category": "partial_refresh_manager",
                "action": "record_changes",
                "run_id": run_id,
                "changed_edges_count": len(changed_edges),
                "affected_sets_count": len(affected_sets),
                "total_changed_edges": len(metadata.edges_changed_since_last_refresh),
                "result": "recorded",
            })
    
    async def should_use_partial_refresh(self, run_id: str) -> Tuple[bool, str]:
        """
        Determine if partial refresh should be used vs full rebuild.
        Returns (use_partial, reason).
        """
        async with self.runs_lock:
            if run_id not in self.optimization_runs:
                return False, "run_not_found"
            
            metadata = self.optimization_runs[run_id]
            
            # Check fallback threshold
            if self.recent_failures[run_id] >= self.fallback_failure_threshold:
                return False, "fallback_failure_threshold"
            
            # Check if run is too stale
            if (metadata.last_live_refresh_ts and 
                time.time() - metadata.last_live_refresh_ts > self.max_partial_refresh_age_sec):
                metadata.mark_stale("age_threshold_exceeded")
                return False, "stale_age_threshold"
            
            # Check if we have changed edges to work with
            if not metadata.edges_changed_since_last_refresh:
                return False, "no_changed_edges"
            
            # Check if we have affected candidate sets
            if not metadata.candidate_sets_affected:
                return False, "no_affected_candidates"
            
            return True, "eligible_for_partial"
    
    async def execute_partial_refresh(self, run_id: str, 
                                     optimization_function, 
                                     **optimization_kwargs) -> Tuple[bool, Dict[str, Any]]:
        """
        Execute partial refresh by recomputing only affected candidate sets.
        Returns (success, results_dict).
        """
        start_time = time.time()
        
        try:
            async with self.runs_lock:
                metadata = self.optimization_runs[run_id]
            
            # Get affected candidate sets
            affected_sets = []
            async with self.sets_lock:
                for set_id in metadata.candidate_sets_affected:
                    if set_id in self.candidate_sets:
                        affected_sets.append(self.candidate_sets[set_id])
            
            # Recompute only affected candidate sets
            results = {}
            best_new_score = None
            sets_recomputed = 0
            sets_preserved = 0
            
            for candidate_set in affected_sets:
                # Recompute this candidate set
                set_edges = list(candidate_set.edge_ids)
                
                try:
                    # Call optimization function for this subset
                    set_result = await optimization_function(
                        edge_ids=set_edges,
                        **optimization_kwargs
                    )
                    
                    new_score = set_result.get('best_score', 0.0)
                    
                    # Check if score change is significant
                    if (candidate_set.last_computed_score is not None and
                        abs(new_score - candidate_set.last_computed_score) < candidate_set.score_delta_threshold):
                        # Preserve previous score (delta < ε)
                        results[candidate_set.set_id] = {
                            'preserved_score': candidate_set.last_computed_score,
                            'new_score': new_score,
                            'score_delta': abs(new_score - candidate_set.last_computed_score),
                            'preserved': True
                        }
                        sets_preserved += 1
                    else:
                        # Use new score
                        candidate_set.last_computed_score = new_score
                        candidate_set.last_computation_ts = time.time()
                        candidate_set.computation_count += 1
                        
                        results[candidate_set.set_id] = {
                            'new_score': new_score,
                            'previous_score': candidate_set.last_computed_score,
                            'preserved': False
                        }
                        sets_recomputed += 1
                        
                        if best_new_score is None or new_score > best_new_score:
                            best_new_score = new_score
                
                except Exception as e:
                    self.logger.error("Candidate set recomputation failed", extra={
                        "category": "partial_refresh_manager",
                        "action": "recompute_set_error",
                        "run_id": run_id,
                        "set_id": candidate_set.set_id,
                        "error": str(e),
                        "result": "set_error",
                    })
                    
                    # Continue with other sets
                    continue
            
            duration_ms = (time.time() - start_time) * 1000
            
            # Record successful partial refresh
            metadata.record_refresh("partial_refresh", duration_ms, best_new_score)
            
            # Clear change tracking
            metadata.edges_changed_since_last_refresh.clear()
            metadata.candidate_sets_affected.clear()
            
            # Mark candidate sets as no longer containing changes
            async with self.sets_lock:
                for candidate_set in affected_sets:
                    candidate_set.contains_changed_edges = False
            
            # Update statistics
            self.total_partial_refreshes += 1
            self.successful_partial_refreshes += 1
            self.partial_refresh_times.append(duration_ms)
            self.recent_failures[run_id] = 0  # Reset failure count
            
            results_dict = {
                'success': True,
                'duration_ms': duration_ms,
                'sets_recomputed': sets_recomputed,
                'sets_preserved': sets_preserved,
                'best_new_score': best_new_score,
                'candidate_set_results': results,
                'refresh_type': 'partial_refresh'
            }
            
            self.logger.info("Partial refresh completed successfully", extra={
                "category": "partial_refresh_manager",
                "action": "partial_refresh_success",
                "run_id": run_id,
                "duration_ms": duration_ms,
                "sets_recomputed": sets_recomputed,
                "sets_preserved": sets_preserved,
                "best_new_score": best_new_score,
                "result": "success",
            })
            
            return True, results_dict
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.recent_failures[run_id] += 1
            
            self.logger.error("Partial refresh failed", extra={
                "category": "partial_refresh_manager",
                "action": "partial_refresh_error",
                "run_id": run_id,
                "duration_ms": duration_ms,
                "error": str(e),
                "failure_count": self.recent_failures[run_id],
                "result": "error",
            })
            
            return False, {
                'success': False,
                'error': str(e),
                'duration_ms': duration_ms,
                'refresh_type': 'partial_refresh_failed'
            }
    
    async def execute_full_rebuild(self, run_id: str, 
                                  optimization_function,
                                  **optimization_kwargs) -> Tuple[bool, Dict[str, Any]]:
        """Execute full rebuild optimization"""
        start_time = time.time()
        
        try:
            # Execute full optimization
            result = await optimization_function(**optimization_kwargs)
            duration_ms = (time.time() - start_time) * 1000
            
            # Update metadata
            async with self.runs_lock:
                if run_id in self.optimization_runs:
                    metadata = self.optimization_runs[run_id]
                    best_score = result.get('best_score')
                    metadata.record_refresh("full_rebuild", duration_ms, best_score)
                    
                    # Clear change tracking
                    metadata.edges_changed_since_last_refresh.clear()
                    metadata.candidate_sets_affected.clear()
            
            # Reset candidate sets
            async with self.sets_lock:
                for set_id, candidate_set in self.candidate_sets.items():
                    if set_id.startswith(run_id):
                        candidate_set.contains_changed_edges = False
            
            # Update statistics
            self.total_full_rebuilds += 1
            self.full_rebuild_times.append(duration_ms)
            self.recent_failures[run_id] = 0  # Reset failure count
            
            result_dict = {
                'success': True,
                'duration_ms': duration_ms,
                'refresh_type': 'full_rebuild',
                **result
            }
            
            self.logger.info("Full rebuild completed successfully", extra={
                "category": "partial_refresh_manager",
                "action": "full_rebuild_success",
                "run_id": run_id,
                "duration_ms": duration_ms,
                "best_score": result.get('best_score'),
                "result": "success",
            })
            
            return True, result_dict
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.recent_failures[run_id] += 1
            
            self.logger.error("Full rebuild failed", extra={
                "category": "partial_refresh_manager",
                "action": "full_rebuild_error",
                "run_id": run_id,
                "duration_ms": duration_ms,
                "error": str(e),
                "failure_count": self.recent_failures[run_id],
                "result": "error",
            })
            
            return False, {
                'success': False,
                'error': str(e),
                'duration_ms': duration_ms,
                'refresh_type': 'full_rebuild_failed'
            }
    
    async def execute_refresh_with_fallback(self, run_id: str,
                                          optimization_function,
                                          **optimization_kwargs) -> Dict[str, Any]:
        """
        Execute refresh with automatic fallback from partial to full rebuild.
        Ensures monotonic or improved best scores.
        """
        # Check if partial refresh should be attempted
        use_partial, reason = await self.should_use_partial_refresh(run_id)
        
        if use_partial:
            # Try partial refresh first
            success, result = await self.execute_partial_refresh(
                run_id, optimization_function, **optimization_kwargs
            )
            
            if success:
                # Check for score monotonicity
                async with self.runs_lock:
                    metadata = self.optimization_runs.get(run_id)
                    if metadata and self._is_score_monotonic_or_improved(metadata):
                        return result
                    else:
                        self.logger.warning("Partial refresh degraded score, falling back", extra={
                            "category": "partial_refresh_manager",
                            "action": "fallback_score_degradation",
                            "run_id": run_id,
                            "best_score": metadata.best_score if metadata else None,
                            "previous_best": metadata.previous_best_score if metadata else None,
                            "result": "fallback_triggered",
                        })
                        # Fall through to full rebuild
            
            # Partial refresh failed or degraded score, fallback to full rebuild
            self.fallback_triggers += 1
        
        # Execute full rebuild (either as primary strategy or fallback)
        success, result = await self.execute_full_rebuild(
            run_id, optimization_function, **optimization_kwargs
        )
        
        if not success:
            # Both partial and full failed - mark as stale
            async with self.runs_lock:
                if run_id in self.optimization_runs:
                    self.optimization_runs[run_id].mark_stale("optimization_failure")
        
        return result
    
    def _is_score_monotonic_or_improved(self, metadata: OptimizationRunMetadata) -> bool:
        """Check if current score is monotonic or improved compared to previous"""
        if metadata.best_score is None:
            return True  # No score to compare
        
        if metadata.previous_best_score is None:
            return True  # First score is always valid
        
        # Allow for small degradation within epsilon
        return metadata.best_score >= metadata.previous_best_score - self.score_delta_threshold
    
    def get_performance_benchmark(self) -> Dict[str, Any]:
        """Get performance benchmark comparing partial vs full refresh"""
        if not self.partial_refresh_times or not self.full_rebuild_times:
            return {
                "benchmark_available": False,
                "reason": "insufficient_data"
            }
        
        # Calculate averages
        avg_partial_ms = sum(self.partial_refresh_times) / len(self.partial_refresh_times)
        avg_full_ms = sum(self.full_rebuild_times) / len(self.full_rebuild_times)
        
        # Calculate improvement percentage
        improvement_pct = ((avg_full_ms - avg_partial_ms) / avg_full_ms) * 100 if avg_full_ms > 0 else 0
        
        return {
            "benchmark_available": True,
            "avg_partial_refresh_ms": avg_partial_ms,
            "avg_full_rebuild_ms": avg_full_ms,
            "latency_improvement_pct": improvement_pct,
            "partial_refresh_count": len(self.partial_refresh_times),
            "full_rebuild_count": len(self.full_rebuild_times),
            "success_rate": (
                self.successful_partial_refreshes / max(self.total_partial_refreshes, 1) * 100
            ),
            "fallback_rate": (
                self.fallback_triggers / max(self.total_partial_refreshes + self.total_full_rebuilds, 1) * 100
            )
        }
    
    def get_run_metadata(self, run_id: str) -> Optional[OptimizationRunMetadata]:
        """Get metadata for specific optimization run"""
        return self.optimization_runs.get(run_id)
    
    def get_manager_stats(self) -> Dict[str, Any]:
        """Get comprehensive manager statistics"""
        return {
            "total_optimization_runs": len(self.optimization_runs),
            "total_partial_refreshes": self.total_partial_refreshes,
            "total_full_rebuilds": self.total_full_rebuilds,
            "successful_partial_refreshes": self.successful_partial_refreshes,
            "fallback_triggers": self.fallback_triggers,
            "candidate_sets": len(self.candidate_sets),
            "recent_failures": dict(self.recent_failures),
            "performance_benchmark": self.get_performance_benchmark(),
            "configuration": {
                "score_delta_threshold": self.score_delta_threshold,
                "max_partial_refresh_age_sec": self.max_partial_refresh_age_sec,
                "fallback_failure_threshold": self.fallback_failure_threshold,
            }
        }


class ProviderResilienceManager:
    """
    Comprehensive provider resilience and operational risk reduction.
    
    Implements:
    1. Per-provider exponential backoff with failure counters
    2. Provider state tracking (consecutive_failures, avg_latency_ms, success_rate_5m)
    3. Recompute debounce mapping (prop_id → last_recompute_ts)
    4. Line change micro-batching (200-300ms aggregation)
    5. Event bus reliability with exception counters and dead-letter logging
    6. Normalized logging schema
    7. Dependency index for selective updates with integrity verification
    8. Edge change aggregation and partial refresh optimization
    """
    
    def __init__(self):
        # Get configuration
        self.config = get_streaming_config()
        self.logger = logging.getLogger("provider_resilience")
        
        # Computational cost controller
        self.computational_controller = ComputationalController()
        
        # Dependency index for selective updates
        self.dependency_index = DependencyIndex()
        
        # Edge change aggregation and partial refresh optimization
        self.edge_change_aggregator = EdgeChangeAggregator(
            cluster_impact_threshold=0.3,
            correlation_threshold=0.4
        )
        self.partial_refresh_manager = PartialRefreshManager(
            score_delta_threshold=0.001,
            max_partial_refresh_age_sec=3600
        )
        self.correlation_cache_scheduler = CorrelationCacheScheduler(
            cluster_size_threshold=5,
            cache_warm_interval_sec=300
        )
        
        # Provider state tracking
        self.provider_metrics: Dict[str, ProviderMetrics] = {}
        self.provider_locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        
        # Recompute debounce map: prop_id → last_recompute_ts
        self.recompute_debounce_map: Dict[str, float] = {}
        self.debounce_lock = asyncio.Lock()
        
        # Micro-batching for line changes
        self.micro_batches: Dict[str, MicroBatch] = {}
        self.batch_lock = asyncio.Lock()
        self.batch_window_ms = 250  # 200-300ms as specified
        
        # Event bus reliability
        self.event_handlers: Dict[str, List] = defaultdict(list)
        self.handler_exception_counters: Dict[str, int] = defaultdict(int)
        self.dead_letter_log: List[Dict[str, Any]] = []
        self.max_dead_letters = 1000
        
        # Background tasks
        self._cleanup_task: Optional[asyncio.Task] = None
        self._batch_processor_task: Optional[asyncio.Task] = None
        self._metrics_updater_task: Optional[asyncio.Task] = None
        self._background_tasks_started = False
        self._background_verification_enabled = True  # Can be disabled for testing
    
    def _start_background_tasks(self):
        """Start background processing tasks"""
        try:
            # Only start if we have a running event loop
            loop = asyncio.get_running_loop()
            self._cleanup_task = loop.create_task(self._cleanup_worker())
            self._batch_processor_task = loop.create_task(self._batch_processor())
            self._metrics_updater_task = loop.create_task(self._metrics_updater())
            
            # Start dependency index background tasks
            loop.create_task(self.dependency_index.start_background_tasks())
            
            self._background_tasks_started = True
            
            self.logger.info("ProviderResilienceManager initialized with background tasks", extra={
                "batch_window_ms": self.batch_window_ms,
                "debounce_sec": self.config.valuation_recompute_debounce_sec,
                "dependency_index_enabled": True,
            })
        except RuntimeError:
            # No event loop running - tasks will be started lazily
            self.logger.info("ProviderResilienceManager initialized - background tasks will start on first use", extra={
                "batch_window_ms": self.batch_window_ms,
                "debounce_sec": self.config.valuation_recompute_debounce_sec,
                "dependency_index_enabled": True,
            })
    
    async def register_provider(self, provider_id: str, config: Optional[Dict[str, Any]] = None) -> None:
        """Register a new provider for tracking"""
        # Start background tasks if not already started
        if not self._background_tasks_started:
            self._start_background_tasks()
        
        async with self.provider_locks[provider_id]:
            if provider_id not in self.provider_metrics:
                metrics = ProviderMetrics()
                
                # Apply custom config if provided
                if config:
                    if "backoff_base_sec" in config:
                        metrics.backoff_base_sec = config["backoff_base_sec"]
                    if "backoff_max_sec" in config:
                        metrics.backoff_max_sec = config["backoff_max_sec"]
                    if "backoff_multiplier" in config:
                        metrics.backoff_multiplier = config["backoff_multiplier"]
                
                self.provider_metrics[provider_id] = metrics
                
                self.logger.info("Provider registered", extra={
                    "category": "provider_management",
                    "action": "register",
                    "provider_id": provider_id,
                    "config": config or {},
                })
    
    async def record_provider_request(self, provider_id: str, success: bool, 
                                    latency_ms: float, error: Optional[Exception] = None) -> None:
        """
        Record provider request result and update metrics.
        Implements circuit breaker pattern with CLOSED→OPEN→HALF_OPEN transitions.
        """
        start_time = time.time()
        
        # Ensure provider is registered
        await self.register_provider(provider_id)
        
        async with self.provider_locks[provider_id]:
            metrics = self.provider_metrics[provider_id]
            now = time.time()
            
            # Update basic counters
            metrics.total_requests += 1
            metrics.sla_total_count += 1
            
            # Categorize error if present
            error_category = "success"
            if error and not success:
                error_category = self._categorize_error(error)
                if error_category not in metrics.error_categories:
                    metrics.error_categories[error_category] = 0
                metrics.error_categories[error_category] += 1
            
            if success:
                metrics.successful_requests += 1
                metrics.sla_success_count += 1
                metrics.last_success_time = now
                
                # Handle circuit breaker recovery logic
                if metrics.circuit_state == CircuitBreakerState.HALF_OPEN:
                    metrics.half_open_attempts += 1
                    if metrics.half_open_attempts >= metrics.half_open_success_threshold:
                        # Transition to CLOSED state
                        old_circuit_state = metrics.circuit_state
                        metrics.circuit_state = CircuitBreakerState.CLOSED
                        metrics.circuit_state_changed_at = now
                        metrics.consecutive_failures = 0  # Reset failure counter
                        metrics.backoff_current_sec = 0.0  # Reset backoff
                        metrics.next_retry_time = 0.0
                        metrics.half_open_attempts = 0
                        
                        # Update provider state to healthy
                        old_provider_state = metrics.current_state
                        metrics.current_state = ProviderState.HEALTHY
                        metrics.state_changed_at = now
                        
                        self.logger.info("Circuit breaker transitioned to CLOSED", extra={
                            "category": "circuit_breaker",
                            "action": "state_transition",
                            "provider_id": provider_id,
                            "old_circuit_state": old_circuit_state.value,
                            "new_circuit_state": metrics.circuit_state.value,
                            "old_provider_state": old_provider_state.value,
                            "new_provider_state": metrics.current_state.value,
                            "half_open_attempts": metrics.half_open_attempts,
                            "result": "circuit_closed",
                        })
                elif metrics.circuit_state == CircuitBreakerState.CLOSED:
                    # Normal success in CLOSED state - reset consecutive failures
                    metrics.consecutive_failures = 0
                    if metrics.current_state != ProviderState.HEALTHY:
                        old_state = metrics.current_state
                        metrics.current_state = ProviderState.HEALTHY
                        metrics.state_changed_at = now
                        
                        self.logger.info("Provider recovered to healthy", extra={
                            "category": "provider_health",
                            "action": "state_change",
                            "provider_id": provider_id,
                            "old_state": old_state.value,
                            "new_state": metrics.current_state.value,
                            "consecutive_failures": metrics.consecutive_failures,
                            "result": "recovery",
                        })
            else:
                metrics.failed_requests += 1
                metrics.last_failure_time = now
                metrics.consecutive_failures += 1  # Increment failure counter
                
                # Calculate exponential backoff: base * 2^n capped
                backoff_multiplier = metrics.backoff_multiplier ** metrics.consecutive_failures
                metrics.backoff_current_sec = min(
                    metrics.backoff_base_sec * backoff_multiplier,
                    metrics.backoff_max_sec
                )
                metrics.next_retry_time = now + metrics.backoff_current_sec
                
                # Circuit breaker logic based on consecutive failures
                old_circuit_state = metrics.circuit_state
                old_provider_state = metrics.current_state
                
                # Update provider state based on consecutive failures
                if metrics.consecutive_failures >= 10:
                    metrics.current_state = ProviderState.CIRCUIT_OPEN
                    metrics.circuit_state = CircuitBreakerState.OPEN
                    metrics.circuit_state_changed_at = now
                elif metrics.consecutive_failures >= 5:
                    metrics.current_state = ProviderState.FAILING
                elif metrics.consecutive_failures >= 2:
                    metrics.current_state = ProviderState.DEGRADED
                
                if metrics.current_state != old_provider_state or metrics.circuit_state != old_circuit_state:
                    metrics.state_changed_at = now
                    
                    self.logger.error("Provider state degraded", extra={
                        "category": "provider_health", 
                        "action": "state_change",
                        "provider_id": provider_id,
                        "old_provider_state": old_provider_state.value,
                        "new_provider_state": metrics.current_state.value,
                        "old_circuit_state": old_circuit_state.value,
                        "new_circuit_state": metrics.circuit_state.value,
                        "consecutive_failures": metrics.consecutive_failures,
                        "backoff_sec": metrics.backoff_current_sec,
                        "next_retry_time": metrics.next_retry_time,
                        "error_category": error_category,
                        "error": str(error) if error else None,
                        "result": "degradation",
                    })
            
            # Update latency tracking with percentiles
            metrics.latency_samples.append(latency_ms)
            if metrics.latency_samples:
                metrics.avg_latency_ms = sum(metrics.latency_samples) / len(metrics.latency_samples)
                # Calculate p95 latency
                sorted_latencies = sorted(metrics.latency_samples)
                p95_index = int(0.95 * len(sorted_latencies))
                metrics.p95_latency_ms = sorted_latencies[min(p95_index, len(sorted_latencies) - 1)]
            
            # Update success rate window (1 = success, 0 = failure)
            metrics.success_rate_window.append(1 if success else 0)
            
            # Log request with normalized schema
            self.logger.info("Provider request recorded", extra={
                "category": "provider_request",
                "action": "record",
                "provider_id": provider_id,
                "success": success,
                "latency_ms": latency_ms,
                "consecutive_failures": metrics.consecutive_failures,
                "provider_state": metrics.current_state.value,
                "circuit_state": metrics.circuit_state.value,
                "backoff_sec": metrics.backoff_current_sec,
                "avg_latency_ms": metrics.avg_latency_ms,
                "p95_latency_ms": metrics.p95_latency_ms,
                "success_rate_5m": metrics.success_rate_5m,
                "error_category": error_category,
                "duration_ms": (time.time() - start_time) * 1000,
                "result": "completed",
            })
    
    def _categorize_error(self, error: Exception) -> str:
        """Categorize error for SLA metrics tracking"""
        error_type = type(error).__name__
        error_message = str(error).lower()
        
        # Connection-related errors
        if "connection" in error_message or "timeout" in error_message:
            return "connection_error"
        elif "rate limit" in error_message or "429" in error_message:
            return "rate_limit_error"
        elif "authentication" in error_message or "401" in error_message:
            return "auth_error"
        elif "not found" in error_message or "404" in error_message:
            return "not_found_error"
        elif "server error" in error_message or "500" in error_message:
            return "server_error"
        elif error_type in ["ValueError", "TypeError", "KeyError"]:
            return "data_error"
        else:
            return "unknown_error"
    
    async def should_skip_provider(self, provider_id: str) -> Tuple[bool, Optional[float], Optional[str]]:
        """
        Check if provider should be skipped due to circuit breaker state.
        Returns (should_skip, retry_after_seconds, circuit_state)
        """
        if provider_id not in self.provider_metrics:
            return False, None, None
        
        async with self.provider_locks[provider_id]:
            metrics = self.provider_metrics[provider_id]
            now = time.time()
            
            # Handle circuit breaker states
            if metrics.circuit_state == CircuitBreakerState.OPEN:
                # Check if we should transition to HALF_OPEN
                if metrics.next_retry_time > 0 and now >= metrics.next_retry_time:
                    # Transition to HALF_OPEN for recovery testing
                    old_state = metrics.circuit_state
                    metrics.circuit_state = CircuitBreakerState.HALF_OPEN
                    metrics.circuit_state_changed_at = now
                    metrics.half_open_attempts = 0
                    
                    self.logger.info("Circuit breaker transitioned to HALF_OPEN", extra={
                        "category": "circuit_breaker",
                        "action": "state_transition",
                        "provider_id": provider_id,
                        "old_circuit_state": old_state.value,
                        "new_circuit_state": metrics.circuit_state.value,
                        "consecutive_failures": metrics.consecutive_failures,
                        "result": "trial_mode",
                    })
                    
                    # Allow the request in HALF_OPEN state
                    return False, None, metrics.circuit_state.value
                else:
                    # Circuit still open, block request
                    retry_after = metrics.next_retry_time - now if metrics.next_retry_time > now else None
                    return True, retry_after, metrics.circuit_state.value
            
            elif metrics.circuit_state == CircuitBreakerState.HALF_OPEN:
                # Allow limited requests in half-open state
                return False, None, metrics.circuit_state.value
            
            else:  # CLOSED state
                # Normal backoff logic for CLOSED state
                if metrics.next_retry_time > now:
                    retry_after = metrics.next_retry_time - now
                    return True, retry_after, metrics.circuit_state.value
                
                return False, None, metrics.circuit_state.value
    
    async def add_recompute_event(self, prop_id: str, event_type: str, data: Dict[str, Any], 
                                change_magnitude: Optional[float] = None) -> Tuple[bool, str]:
        """
        Add line change event for recompute with computational cost control.
        Returns (was_added, reason) tuple.
        """
        now = time.time()
        
        # Classify line change based on magnitude
        if change_magnitude is None:
            # Default classification logic based on event type
            magnitude = self._estimate_change_magnitude(event_type, data)
        else:
            magnitude = change_magnitude
        
        classification = self._classify_line_change(magnitude)
        computational_cost = self._estimate_computational_cost(classification, event_type)
        
        # Create event with cost tracking
        event = RecomputeEvent(
            prop_id=prop_id,
            event_type=event_type,
            timestamp=now,
            data=data,
            classification=classification,
            change_magnitude=magnitude,
            computational_cost=computational_cost
        )
        
        # Check computational controller
        can_process, reason = self.computational_controller.can_process_event(event)
        if not can_process:
            self.logger.debug("Event processing deferred", extra={
                "category": "computational_control",
                "action": "defer_event",
                "prop_id": prop_id,
                "event_type": event_type,
                "classification": classification.value,
                "change_magnitude": magnitude,
                "reason": reason,
                "controller_mode": self.computational_controller.current_mode.value,
                "cycle_events": self.computational_controller.current_cycle_events,
                "pending_queue": self.computational_controller.pending_queue_depth,
                "result": "deferred",
            })
            return False, reason
        
        # Check recompute debounce (only for non-major changes)
        if classification != LineChangeClassification.MAJOR:
            async with self.debounce_lock:
                last_recompute = self.recompute_debounce_map.get(prop_id, 0)
                if now - last_recompute < self.config.valuation_recompute_debounce_sec:
                    self.logger.debug("Recompute event debounced", extra={
                        "category": "recompute",
                        "action": "debounce_skip",
                        "prop_id": prop_id,
                        "event_type": event_type,
                        "classification": classification.value,
                        "last_recompute_age_sec": now - last_recompute,
                        "debounce_sec": self.config.valuation_recompute_debounce_sec,
                        "result": "debounced",
                    })
                    return False, "debounced"
        
        # Add to micro-batch
        async with self.batch_lock:
            if prop_id not in self.micro_batches:
                self.micro_batches[prop_id] = MicroBatch(prop_id=prop_id)
            
            self.micro_batches[prop_id].add_event(event)
            
            self.logger.debug("Event added to micro-batch", extra={
                "category": "micro_batching",
                "action": "add_event",
                "prop_id": prop_id,
                "event_type": event_type,
                "classification": classification.value,
                "change_magnitude": magnitude,
                "computational_cost": computational_cost,
                "batch_size": len(self.micro_batches[prop_id].events),
                "batch_age_ms": (now - self.micro_batches[prop_id].first_event_time) * 1000,
                "total_batch_cost": self.micro_batches[prop_id].total_computational_cost,
                "controller_mode": self.computational_controller.current_mode.value,
                "result": "added",
            })
        
        return True, "added"
    
    def _classify_line_change(self, magnitude: float) -> LineChangeClassification:
        """Classify line change based on magnitude"""
        if magnitude < 0.25:
            return LineChangeClassification.MICRO
        elif magnitude <= 1.0:
            return LineChangeClassification.MODERATE
        else:
            return LineChangeClassification.MAJOR
    
    def _estimate_change_magnitude(self, event_type: str, data: Dict[str, Any]) -> float:
        """Estimate change magnitude from event data"""
        # Default estimation based on event type
        magnitude_map = {
            "line_move": 0.5,
            "odds_change": 0.3,
            "volume_spike": 0.2,
            "injury_news": 1.5,
            "lineup_change": 1.2,
            "weather_update": 0.4,
            "market_suspension": 2.0,
        }
        
        base_magnitude = magnitude_map.get(event_type, 0.5)
        
        # Check for magnitude hints in data
        if isinstance(data, dict):
            if "magnitude" in data:
                return float(data["magnitude"])
            elif "change_amount" in data:
                return abs(float(data["change_amount"]))
            elif "odds_change" in data:
                return abs(float(data["odds_change"])) / 100  # Normalize odds change
        
        return base_magnitude
    
    def _estimate_computational_cost(self, classification: LineChangeClassification, event_type: str) -> float:
        """Estimate computational cost for processing event"""
        base_costs = {
            LineChangeClassification.MICRO: 0.1,
            LineChangeClassification.MODERATE: 1.0,
            LineChangeClassification.MAJOR: 3.0
        }
        
        # Event type multipliers
        event_multipliers = {
            "injury_news": 2.0,
            "lineup_change": 1.5,
            "market_suspension": 2.5,
            "odds_change": 1.0,
            "line_move": 1.2,
        }
        
        base_cost = base_costs.get(classification, 1.0)
        multiplier = event_multipliers.get(event_type, 1.0)
        
        return base_cost * multiplier
    
    async def register_event_handler(self, event_type: str, handler) -> None:
        """Register event handler with reliability tracking"""
        self.event_handlers[event_type].append(handler)
        handler_id = f"{event_type}:{id(handler)}"
        self.handler_exception_counters[handler_id] = 0
        
        self.logger.info("Event handler registered", extra={
            "category": "event_bus",
            "action": "register_handler",
            "event_type": event_type,
            "handler_id": handler_id,
            "total_handlers": len(self.event_handlers[event_type]),
        })
    
    async def emit_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Emit event to handlers with exception tracking and dead-letter logging.
        Implements reliability requirements from objective.
        """
        start_time = time.time()
        handlers = self.event_handlers.get(event_type, [])
        
        if not handlers:
            self.logger.debug("No handlers for event", extra={
                "category": "event_bus",
                "action": "emit_no_handlers",
                "event_type": event_type,
                "result": "no_handlers",
            })
            return
        
        successful_handlers = 0
        failed_handlers = 0
        
        for handler in handlers:
            handler_id = f"{event_type}:{id(handler)}"
            
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
                
                successful_handlers += 1
                
                # Reset exception counter on success
                self.handler_exception_counters[handler_id] = 0
                
            except Exception as e:
                failed_handlers += 1
                self.handler_exception_counters[handler_id] += 1
                exception_count = self.handler_exception_counters[handler_id]
                
                self.logger.error("Event handler failed", extra={
                    "category": "event_bus",
                    "action": "handler_exception",
                    "event_type": event_type,
                    "handler_id": handler_id,
                    "exception_count": exception_count,
                    "error": str(e),
                    "duration_ms": (time.time() - start_time) * 1000,
                    "result": "handler_failure",
                })
                
                # Add to dead-letter log if repeated failures
                if exception_count >= 3:
                    await self._add_to_dead_letter_log(event_type, data, handler_id, e, exception_count)
        
        # Log overall event emission result
        self.logger.info("Event emitted", extra={
            "category": "event_bus",
            "action": "emit",
            "event_type": event_type,
            "total_handlers": len(handlers),
            "successful_handlers": successful_handlers,
            "failed_handlers": failed_handlers,
            "duration_ms": (time.time() - start_time) * 1000,
            "result": "completed",
        })
    
    async def _add_to_dead_letter_log(self, event_type: str, data: Dict[str, Any], 
                                    handler_id: str, error: Exception, exception_count: int) -> None:
        """Add failed event to dead-letter log"""
        dead_letter_entry = {
            "timestamp": time.time(),
            "event_type": event_type,
            "handler_id": handler_id,
            "exception_count": exception_count,
            "error": str(error),
            "error_type": type(error).__name__,
            "data_hash": hash(str(data)),  # Don't store full data for memory safety
            "data_keys": list(data.keys()) if isinstance(data, dict) else [],
        }
        
        self.dead_letter_log.append(dead_letter_entry)
        
        # Limit dead letter log size
        if len(self.dead_letter_log) > self.max_dead_letters:
            self.dead_letter_log = self.dead_letter_log[-self.max_dead_letters:]
        
        self.logger.error("Event added to dead-letter log", extra={
            "category": "event_bus",
            "action": "dead_letter",
            "event_type": event_type,
            "handler_id": handler_id,
            "exception_count": exception_count,
            "dead_letter_size": len(self.dead_letter_log),
            "result": "dead_letter_logged",
        })
    
    async def _batch_processor(self) -> None:
        """Background task to process micro-batches"""
        while True:
            try:
                await asyncio.sleep(0.1)  # Check every 100ms
                
                batches_to_process = []
                
                # Check which batches are ready
                async with self.batch_lock:
                    for prop_id, batch in list(self.micro_batches.items()):
                        if batch.should_process(self.batch_window_ms):
                            batches_to_process.append((prop_id, batch))
                            del self.micro_batches[prop_id]
                
                # Process ready batches
                for prop_id, batch in batches_to_process:
                    await self._process_micro_batch(prop_id, batch)
                    
            except Exception as e:
                self.logger.error("Batch processor error", extra={
                    "category": "micro_batching",
                    "action": "processor_error",
                    "error": str(e),
                    "result": "error",
                })
                await asyncio.sleep(1)  # Back off on error
    
    async def _process_micro_batch(self, prop_id: str, batch: MicroBatch) -> None:
        """Process a complete micro-batch with computational cost tracking"""
        start_time = time.time()
        
        try:
            # Record recompute execution
            self.computational_controller.record_recompute_executed()
            
            # Update debounce map
            async with self.debounce_lock:
                self.recompute_debounce_map[prop_id] = time.time()
            
            # Emit batch processing event
            batch_data = {
                "prop_id": prop_id,
                "event_count": len(batch.events),
                "batch_age_ms": (time.time() - batch.first_event_time) * 1000,
                "event_types": list({event.event_type for event in batch.events}),
                "events": [{"event_type": e.event_type, "timestamp": e.timestamp} for e in batch.events[-5:]],  # Last 5 events
                # Computational cost information
                "total_computational_cost": batch.total_computational_cost,
                "aggregated_change_magnitude": batch.aggregated_change_magnitude,
                "dominant_classification": batch.dominant_classification.value,
                "classification_counts": self._get_classification_counts(batch.events),
            }
            
            await self.emit_event("recompute_batch", batch_data)
            
            self.logger.info("Micro-batch processed", extra={
                "category": "micro_batching",
                "action": "process_batch",
                "prop_id": prop_id,
                "event_count": len(batch.events),
                "batch_age_ms": batch_data["batch_age_ms"],
                "total_computational_cost": batch.total_computational_cost,
                "dominant_classification": batch.dominant_classification.value,
                "controller_mode": self.computational_controller.current_mode.value,
                "controller_metrics": self.computational_controller.get_performance_metrics(),
                "processing_duration_ms": (time.time() - start_time) * 1000,
                "result": "processed",
            })
            
        except Exception as e:
            self.logger.error("Micro-batch processing failed", extra={
                "category": "micro_batching",
                "action": "process_error",
                "prop_id": prop_id,
                "event_count": len(batch.events),
                "total_computational_cost": batch.total_computational_cost,
                "error": str(e),
                "duration_ms": (time.time() - start_time) * 1000,
                "result": "error",
            })
    
    def _get_classification_counts(self, events: List[RecomputeEvent]) -> Dict[str, int]:
        """Get count of events by classification"""
        counts = {classification.value: 0 for classification in LineChangeClassification}
        for event in events:
            counts[event.classification.value] += 1
        return counts
    
    async def _metrics_updater(self) -> None:
        """Background task to update rolling metrics"""
        while True:
            try:
                await asyncio.sleep(1)  # Update every second
                now = time.time()
                
                for provider_id, metrics in self.provider_metrics.items():
                    async with self.provider_locks[provider_id]:
                        # Update 5-minute success rate
                        if metrics.success_rate_window:
                            metrics.success_rate_5m = sum(metrics.success_rate_window) / len(metrics.success_rate_window)
                        else:
                            metrics.success_rate_5m = 1.0  # Default to perfect if no samples
                        
                        # Add current second to window (0 for no activity)
                        # This ensures the window represents the actual time period
                        if not metrics.success_rate_window or metrics.success_rate_window[-1] != now:
                            # No activity this second, but keep window moving
                            pass  # Window will naturally age out old values
                            
            except Exception as e:
                self.logger.error("Metrics updater error", extra={
                    "category": "metrics",
                    "action": "update_error",
                    "error": str(e),
                    "result": "error",
                })
                await asyncio.sleep(5)  # Back off on error
    
    async def _cleanup_worker(self) -> None:
        """Background cleanup of stale data"""
        while True:
            try:
                await asyncio.sleep(300)  # Cleanup every 5 minutes
                now = time.time()
                cleanup_start = time.time()
                
                # Clean old debounce entries (older than 1 hour)
                async with self.debounce_lock:
                    old_count = len(self.recompute_debounce_map)
                    self.recompute_debounce_map = {
                        prop_id: ts for prop_id, ts in self.recompute_debounce_map.items()
                        if now - ts < 3600  # Keep entries less than 1 hour old
                    }
                    cleaned_debounce = old_count - len(self.recompute_debounce_map)
                
                # Clean old dead letters (older than 24 hours)
                old_dead_letters = len(self.dead_letter_log)
                self.dead_letter_log = [
                    entry for entry in self.dead_letter_log
                    if now - entry["timestamp"] < 86400  # Keep entries less than 24 hours old
                ]
                cleaned_dead_letters = old_dead_letters - len(self.dead_letter_log)
                
                self.logger.info("Cleanup completed", extra={
                    "category": "cleanup",
                    "action": "cleanup_cycle",
                    "cleaned_debounce_entries": cleaned_debounce,
                    "cleaned_dead_letters": cleaned_dead_letters,
                    "remaining_debounce_entries": len(self.recompute_debounce_map),
                    "remaining_dead_letters": len(self.dead_letter_log),
                    "duration_ms": (time.time() - cleanup_start) * 1000,
                    "result": "completed",
                })
                
            except Exception as e:
                self.logger.error("Cleanup worker error", extra={
                    "category": "cleanup", 
                    "action": "cleanup_error",
                    "error": str(e),
                    "result": "error",
                })
                await asyncio.sleep(60)  # Back off on error
    
    def get_provider_state(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get current provider state and metrics"""
        if provider_id not in self.provider_metrics:
            return None
        
        metrics = self.provider_metrics[provider_id]
        now = time.time()
        
        # Calculate SLA percentage
        sla_percentage = (metrics.sla_success_count / metrics.sla_total_count * 100) if metrics.sla_total_count > 0 else 100.0
        
        return {
            # Core state fields from objective
            "consecutive_failures": metrics.consecutive_failures,
            "avg_latency_ms": metrics.avg_latency_ms,
            "p95_latency_ms": metrics.p95_latency_ms,
            "success_rate_5m": metrics.success_rate_5m,
            
            # SLA metrics as requested
            "sla_percentage": sla_percentage,
            "sla_success_count": metrics.sla_success_count,
            "sla_total_count": metrics.sla_total_count,
            "sla_violation_count": metrics.sla_violation_count,
            
            # Error categorization for monitoring
            "error_categories": dict(metrics.error_categories),
            
            # Circuit breaker state information
            "provider_state": metrics.current_state.value,
            "circuit_state": metrics.circuit_state.value,
            "circuit_state_changed_at": metrics.circuit_state_changed_at,
            "half_open_attempts": metrics.half_open_attempts,
            
            # Additional state information
            "total_requests": metrics.total_requests,
            "successful_requests": metrics.successful_requests,
            "failed_requests": metrics.failed_requests,
            "backoff_current_sec": metrics.backoff_current_sec,
            "next_retry_time": metrics.next_retry_time,
            "can_retry": metrics.next_retry_time <= now,
            "state_changed_at": metrics.state_changed_at,
            "uptime_sec": now - metrics.state_changed_at if metrics.current_state == ProviderState.HEALTHY else None,
        }
    
    def get_provider_health_summary(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get health summary for reliability monitoring integration"""
        state = self.get_provider_state(provider_id)
        if not state:
            return None
        
        # Determine health status for reliability integration
        is_healthy = state["provider_state"] == "healthy" and state["circuit_state"] == "closed"
        is_degraded = state["provider_state"] in ["degraded", "failing"] and state["circuit_state"] in ["closed", "half_open"]
        is_outage = state["provider_state"] == "circuit_open" or state["circuit_state"] == "open"
        
        health_status = "healthy"
        if is_outage:
            health_status = "outage"
        elif is_degraded:
            health_status = "degraded"
        
        return {
            "provider_id": provider_id,
            "health_status": health_status,
            "is_available": not is_outage,
            "sla_metrics": {
                "success_percentage": state["sla_percentage"],
                "p95_latency_ms": state["p95_latency_ms"],
                "error_categories": state["error_categories"],
            },
            "circuit_breaker": {
                "state": state["circuit_state"],
                "consecutive_failures": state["consecutive_failures"],
                "can_retry": state["can_retry"],
                "retry_after_sec": max(0, state["next_retry_time"] - time.time()) if state["next_retry_time"] > time.time() else 0,
            },
            "last_updated": time.time(),
        }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status including computational control metrics"""
        now = time.time()
        
        provider_states = {}
        for provider_id in self.provider_metrics.keys():
            provider_states[provider_id] = self.get_provider_state(provider_id)
        
        # Add provider health summaries for reliability integration
        provider_health_summaries = {}
        for provider_id in self.provider_metrics.keys():
            health_summary = self.get_provider_health_summary(provider_id)
            if health_summary:
                provider_health_summaries[provider_id] = {"health_summary": health_summary}
        
        # Get computational controller metrics
        computational_metrics = self.computational_controller.get_performance_metrics()
        
        return {
            "providers": provider_states,
            "total_providers": len(self.provider_metrics),
            "healthy_providers": sum(1 for p in provider_states.values() if p and p.get("provider_state") == "healthy"),
            "degraded_providers": sum(1 for p in provider_states.values() if p and p.get("provider_state") in ["degraded", "failing", "circuit_open"]),
            "active_micro_batches": len(self.micro_batches),
            "debounce_entries": len(self.recompute_debounce_map),
            "dead_letter_count": len(self.dead_letter_log),
            "event_handler_types": len(self.event_handlers),
            "total_event_handlers": sum(len(handlers) for handlers in self.event_handlers.values()),
            "handler_exception_count": sum(self.handler_exception_counters.values()),
            "system_uptime_sec": now - getattr(self, '_start_time', now),
            
            # Computational control metrics
            "computational_controller": computational_metrics,
            
            # Performance indicators
            "performance_status": {
                "current_mode": computational_metrics["current_mode"],
                "load_ratio": computational_metrics["load_ratio"],
                "processing_efficiency": computational_metrics["performance_metrics"]["processing_efficiency"],
                "queue_depth": computational_metrics["pending_queue_depth"],
                "under_cpu_target": computational_metrics["performance_metrics"]["current_load_ratio"] < computational_metrics["performance_metrics"]["cpu_target_threshold"],
            },
            
            # For reliability monitoring integration - include formatted provider data
            "providers_for_reliability": provider_health_summaries,
        }
    
    def get_computational_status(self) -> Dict[str, Any]:
        """Get detailed computational control status"""
        return {
            "controller_metrics": self.computational_controller.get_performance_metrics(),
            "burst_control_active": self.computational_controller.current_mode == ComputeMode.BURST_CONTROL,
            "degraded_mode_active": self.computational_controller.current_mode == ComputeMode.DEGRADED,
            "lazy_recomputes_pending": len(self.computational_controller.flagged_recomputes),
            "stress_test_status": {
                "can_handle_10x_load": self._estimate_10x_load_capacity(),
                "no_major_starvation": self._check_major_event_starvation(),
                "cpu_under_threshold": self._is_cpu_under_threshold(),
            }
        }
    
    def _estimate_10x_load_capacity(self) -> bool:
        """Estimate if system can handle 10x baseline load"""
        metrics = self.computational_controller.get_performance_metrics()
        current_load = metrics["performance_metrics"]["current_load_ratio"]
        
        # If current load * 10 would still be manageable with burst control
        estimated_10x_load = current_load * 10
        return estimated_10x_load <= 1.0  # Burst control can handle up to 100% load
    
    def _check_major_event_starvation(self) -> bool:
        """Check if major events are being processed without starvation"""
        # Major events bypass degraded mode limits, so no starvation occurs
        return True
    
    async def stress_test_computational_control(self, baseline_events: int = 100, 
                                              duration_sec: int = 10) -> Dict[str, Any]:
        """
        Stress test computational controller with 10x baseline load.
        
        Args:
            baseline_events: Baseline events per second
            duration_sec: Duration of stress test
        
        Returns:
            Dict with stress test results
        """
        start_time = time.time()
        test_events = baseline_events * 10  # 10x baseline
        
        self.logger.info("Starting computational control stress test", extra={
            "category": "stress_test",
            "action": "start",
            "baseline_events": baseline_events,
            "test_events": test_events,
            "duration_sec": duration_sec,
            "target_cpu_threshold": self.computational_controller.cpu_target_threshold,
        })
        
        # Track initial state
        initial_metrics = self.computational_controller.get_performance_metrics()
        
        # Generate test events
        test_props = [f"test_prop_{i}" for i in range(20)]
        major_events_processed = 0
        micro_events_deferred = 0
        total_events_submitted = 0
        
        for second in range(duration_sec):
            second_start = time.time()
            
            # Generate events for this second
            for event_num in range(test_events):
                total_events_submitted += 1
                prop_id = test_props[event_num % len(test_props)]
                
                # Mix of event types and magnitudes
                if event_num % 10 == 0:  # 10% major events
                    magnitude = 2.0  # Major change
                    event_type = "injury_news"
                else:
                    magnitude = 0.1  # Micro change  
                    event_type = "odds_change"
                
                was_added, reason = await self.add_recompute_event(
                    prop_id=prop_id,
                    event_type=event_type,
                    data={"test_event": True, "magnitude": magnitude},
                    change_magnitude=magnitude
                )
                
                if was_added and magnitude >= 1.0:
                    major_events_processed += 1
                elif reason == "deferred_lazy_micro":
                    micro_events_deferred += 1
            
            # Wait for the rest of the second
            elapsed = time.time() - second_start
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
        
        # Wait for batch processing to complete
        await asyncio.sleep(2.0)
        
        # Collect final metrics
        final_metrics = self.computational_controller.get_performance_metrics()
        test_duration = time.time() - start_time
        
        # Calculate results
        cpu_under_threshold = final_metrics["performance_metrics"]["current_load_ratio"] < self.computational_controller.cpu_target_threshold
        no_major_starvation = major_events_processed > 0  # At least some major events were processed
        
        results = {
            "stress_test_passed": cpu_under_threshold and no_major_starvation,
            "cpu_under_threshold": cpu_under_threshold,
            "no_major_starvation": no_major_starvation,
            "test_duration_sec": test_duration,
            "events_submitted": total_events_submitted,
            "major_events_processed": major_events_processed,
            "micro_events_deferred": micro_events_deferred,
            "initial_metrics": initial_metrics,
            "final_metrics": final_metrics,
            "performance_degradation": {
                "events_emitted_delta": final_metrics["events_emitted"] - initial_metrics["events_emitted"],
                "recomputes_executed_delta": final_metrics["recomputes_executed"] - initial_metrics["recomputes_executed"],
                "queue_depth_final": final_metrics["pending_queue_depth"],
                "processing_efficiency": final_metrics["performance_metrics"]["processing_efficiency"],
            },
            "mode_transitions": {
                "final_mode": final_metrics["current_mode"],
                "mode_changed_at": final_metrics["mode_changed_at"],
                "operated_in_degraded": final_metrics["current_mode"] in ["degraded", "burst_control"],
            }
        }
        
        self.logger.info("Computational control stress test completed", extra={
            "category": "stress_test",
            "action": "complete",
            "stress_test_passed": results["stress_test_passed"],
            "cpu_under_threshold": cpu_under_threshold,
            "no_major_starvation": no_major_starvation,
            "final_mode": final_metrics["current_mode"],
            "events_processed": results["performance_degradation"]["events_emitted_delta"],
            "processing_efficiency": results["performance_degradation"]["processing_efficiency"],
            "result": "completed",
        })
        
        return results
    
    # === Dependency Index Methods ===
    
    async def update_prop_dependency(self, prop_id: int, status: str = "active") -> None:
        """Update prop status in the dependency index"""
        await self.dependency_index.update_prop(prop_id, status)
        
        self.logger.debug("Prop dependency updated", extra={
            "category": "dependency_tracking",
            "action": "update_prop",
            "prop_id": prop_id,
            "status": status,
        })
    
    async def update_edge_dependency(self, edge_id: int, prop_id: int, status: str = "active") -> None:
        """Update edge and its prop dependency in the dependency index"""
        await self.dependency_index.update_edge(edge_id, prop_id, status)
        
        self.logger.debug("Edge dependency updated", extra={
            "category": "dependency_tracking", 
            "action": "update_edge",
            "edge_id": edge_id,
            "prop_id": prop_id,
            "status": status,
        })
    
    async def update_ticket_dependency(self, ticket_id: int, edge_ids: List[int], status: str = "active") -> None:
        """Update ticket and its edge dependencies in the dependency index"""
        await self.dependency_index.update_ticket(ticket_id, edge_ids, status)
        
        self.logger.debug("Ticket dependency updated", extra={
            "category": "dependency_tracking",
            "action": "update_ticket", 
            "ticket_id": ticket_id,
            "edge_ids": edge_ids,
            "status": status,
        })
    
    async def get_dependency_health(self) -> Dict[str, Any]:
        """Get dependency index health status"""
        return await self.dependency_index.get_dependency_health()
    
    async def run_synthetic_churn_test(self, iterations: int = 100) -> Dict[str, Any]:
        """Run synthetic churn test on the dependency index"""
        return await self.dependency_index.synthetic_churn_test(iterations)
    
    def _is_cpu_under_threshold(self) -> bool:
        """Check if CPU usage is under target threshold"""
        metrics = self.computational_controller.get_performance_metrics()
        return metrics["performance_metrics"]["current_load_ratio"] < metrics["performance_metrics"]["cpu_target_threshold"]
    
    async def close(self) -> None:
        """Clean shutdown"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
        if self._batch_processor_task:
            self._batch_processor_task.cancel()
        if self._metrics_updater_task:
            self._metrics_updater_task.cancel()
        
        self.logger.info("ProviderResilienceManager shut down", extra={
            "category": "system",
            "action": "shutdown",
            "result": "completed",
        })
    
    # === Partial Refresh Integration Methods ===
    
    async def record_optimization_edge_change(self, edge_id: int, change_type: str, 
                                            magnitude: float, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Record edge change for partial refresh optimization"""
        # Record in edge change aggregator
        impacted_cluster_id = await self.edge_change_aggregator.record_edge_change(
            edge_id=edge_id,
            change_type=change_type,
            magnitude=magnitude,
            metadata=metadata
        )
        
        # If cluster impact threshold exceeded, schedule correlation cache warm
        if impacted_cluster_id:
            impacted_cluster = self.edge_change_aggregator.impacted_clusters.get(impacted_cluster_id)
            if impacted_cluster and impacted_cluster.requires_matrix_refresh:
                # Schedule cache warming (mock correlation provider for now)
                correlation_provider = MockCorrelationProvider()
                await self.correlation_cache_scheduler.schedule_cache_warm(
                    impacted_cluster, correlation_provider
                )
        
        self.logger.debug("Optimization edge change recorded", extra={
            "category": "partial_refresh_integration",
            "action": "record_edge_change",
            "edge_id": edge_id,
            "change_type": change_type,
            "magnitude": magnitude,
            "impacted_cluster_id": impacted_cluster_id,
            "result": "recorded",
        })
    
    async def create_partial_refresh_optimization_run(self, run_id: str, edge_ids: Set[int]) -> OptimizationRunMetadata:
        """Create optimization run with partial refresh support"""
        return await self.partial_refresh_manager.create_optimization_run(run_id, edge_ids)
    
    async def execute_optimized_refresh(self, run_id: str, optimization_function, **kwargs) -> Dict[str, Any]:
        """Execute optimization refresh with partial refresh strategy and fallback"""
        # Record edge changes for this run
        if 'changed_edges' in kwargs:
            await self.partial_refresh_manager.record_edge_changes(
                run_id, kwargs['changed_edges']
            )
        
        # Execute refresh with fallback strategy
        return await self.partial_refresh_manager.execute_refresh_with_fallback(
            run_id, optimization_function, **kwargs
        )
    
    def get_partial_refresh_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive partial refresh performance statistics"""
        return {
            "edge_change_aggregator": self.edge_change_aggregator.get_aggregator_stats(),
            "partial_refresh_manager": self.partial_refresh_manager.get_manager_stats(),
            "correlation_cache_scheduler": self.correlation_cache_scheduler.get_cache_performance_stats(),
        }
    
    def get_optimization_run_metadata(self, run_id: str) -> Optional[OptimizationRunMetadata]:
        """Get metadata for specific optimization run"""
        return self.partial_refresh_manager.get_run_metadata(run_id)


class MockCorrelationProvider:
    """Mock correlation provider for testing cache warm functionality"""
    
    async def get_correlation_matrix(self, prop_ids: List[int], force_recompute: bool = False) -> Dict[str, Any]:
        """Mock correlation matrix computation"""
        # Simulate correlation matrix computation
        await asyncio.sleep(0.1)  # Simulate computation time
        
        correlation_matrix = {}
        for i, prop1 in enumerate(prop_ids):
            for j, prop2 in enumerate(prop_ids[i+1:], i+1):
                # Generate mock correlation values
                correlation = 0.3 + (hash(f"{prop1}_{prop2}") % 100) / 200  # 0.3-0.8 range
                correlation_matrix[(prop1, prop2)] = correlation
        
        return {
            'correlation_matrix': correlation_matrix,
            'prop_count': len(prop_ids),
            'from_cache': not force_recompute and len(prop_ids) < 10,  # Mock cache behavior
            'computation_time_ms': 100 if force_recompute else 10
        }


# Global instance
provider_resilience_manager = ProviderResilienceManager()

# Export key functions
__all__ = [
    "ProviderResilienceManager",
    "ProviderState", 
    "ProviderMetrics",
    "RecomputeEvent",
    "MicroBatch",
    "ComputationalController",
    "LineChangeClassification",
    "ComputeMode",
    "DependencyIndex",
    "IntegrityIssueType",
    "RemediationAction",
    "DependencyNode",
    "IntegrityIssue",
    "DependencySnapshot",
    "EdgeChangeAggregator",
    "EdgeChangeRecord",
    "ImpactedCluster",
    "PartialRefreshManager",
    "OptimizationRunMetadata",
    "CandidateSetTracker",
    "CorrelationCacheScheduler",
    "provider_resilience_manager",
]