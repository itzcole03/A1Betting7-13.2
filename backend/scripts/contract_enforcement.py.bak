#!/usr/bin/env python3
"""
API Contract Enforcement Tool

Scans backend/routes/ for contract violations and provides detailed reporting.
Used by pre-commit hooks and CI/CD pipeline to prevent regressions.

Usage:
    python scripts/contract_enforcement.py [--fix] [--report] [--threshold N]
"""

import re
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime


class ContractViolation:
    def __init__(self, file_path: str, line: int, violation_type: str, 
                 pattern: str, match_text: str, severity: str = "medium"):
        self.file_path = file_path
        self.line = line
        self.violation_type = violation_type
        self.pattern = pattern
        self.match_text = match_text
        self.severity = severity
    
    def __repr__(self):
        return f"{self.file_path}:{self.line} [{self.severity}] {self.violation_type}"


class APIContractEnforcer:
    """Enforces API contract standards across route files"""
    
    # Violation patterns with descriptions and severity levels
    VIOLATION_PATTERNS = [
        {
            "pattern": r'raise HTTPException\(',
            "type": "Direct HTTPException Usage",
            "severity": "high",
            "description": "Use exception handlers instead of direct HTTPException",
            "fix_suggestion": "Replace with proper exception handling pattern"
        },
        {
            "pattern": r'return\s+\{\s*["\']error["\']:\s*[^}]+\}',
            "type": "Direct Error Dict Return", 
            "severity": "high",
            "description": "Return format bypasses contract structure",
            "fix_suggestion": "Use HTTPException and let handler format response"
        },
        {
            "pattern": r'return\s+\{\s*["\']status["\']:\s*["\']error["\']',
            "type": "Status Error Return",
            "severity": "high", 
            "description": "Non-standard error status format",
            "fix_suggestion": "Use contract format: {success, data, error}"
        },
        {
            "pattern": r'JSONResponse\([^)]*status_code\s*=\s*[45]\d\d[^)]*["\']error["\']',
            "type": "JSONResponse Error",
            "severity": "medium",
            "description": "Direct JSONResponse bypasses exception handling",
            "fix_suggestion": "Raise HTTPException instead of returning JSONResponse"
        },
        {
            "pattern": r'return\s+[^{]*$',
            "type": "Non-Dict Return",
            "severity": "low",
            "description": "Endpoint returns non-dictionary (may not follow contract)",
            "fix_suggestion": "Ensure return follows {success, data, error} format"
        }
    ]
    
    # Critical files that must be fully compliant
    CRITICAL_FILES = [
        "enhanced_api.py",
        "production_health_routes.py", 
        "unified_api.py",
        "optimized_api_routes.py"
    ]
    
    def __init__(self, routes_dir: Path = None):
        self.routes_dir = routes_dir or Path("backend/routes")
        self.violations: List[ContractViolation] = []
        self.stats = {
            "files_scanned": 0,
            "violations_found": 0,
            "critical_violations": 0,
            "files_with_violations": 0
        }
    
    def scan_files(self) -> List[ContractViolation]:
        """Scan all Python files in routes directory for violations"""
        violations = []
        
        if not self.routes_dir.exists():
            print(f"❌ Routes directory not found: {self.routes_dir}")
            return violations
        
        python_files = list(self.routes_dir.glob("*.py"))
        self.stats["files_scanned"] = len([f for f in python_files if not f.name.startswith("__")])
        
        for py_file in python_files:
            if py_file.name.startswith("__"):
                continue
                
            try:
                file_violations = self._scan_file(py_file)
                if file_violations:
                    violations.extend(file_violations)
                    self.stats["files_with_violations"] += 1
                    
            except Exception as e:
                print(f"⚠️  Warning: Could not scan {py_file}: {e}")
        
        self.violations = violations
        self.stats["violations_found"] = len(violations)
        self.stats["critical_violations"] = len([v for v in violations if v.severity == "high"])
        
        return violations
    
    def _scan_file(self, file_path: Path) -> List[ContractViolation]:
        """Scan a single file for contract violations"""
        violations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Could not read {file_path}: {e}")
            return violations
        
        for pattern_config in self.VIOLATION_PATTERNS:
            pattern = pattern_config["pattern"]
            violation_type = pattern_config["type"]
            severity = pattern_config["severity"]
            
            matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                match_text = match.group()[:80]  # First 80 characters
                
                violation = ContractViolation(
                    file_path=str(file_path),
                    line=line_num,
                    violation_type=violation_type,
                    pattern=pattern,
                    match_text=match_text,
                    severity=severity
                )
                violations.append(violation)
        
        return violations
    
    def check_response_model_annotations(self) -> List[Dict[str, Any]]:
        """Check that critical route files have response_model annotations"""
        missing_annotations = []
        
        for filename in self.CRITICAL_FILES:
            file_path = self.routes_dir / filename
            if not file_path.exists():
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find route definitions
                route_pattern = r'@router\.(get|post|put|delete|patch)\s*\([^)]*\)\s*\n\s*(?:async\s+)?def\s+(\w+)'
                response_model_pattern = r'response_model\s*='
                
                for match in re.finditer(route_pattern, content, re.MULTILINE):
                    method = match.group(1)
                    func_name = match.group(2)
                    line_start = content[:match.start()].count('\n') + 1
                    
                    # Skip certain utility endpoints
                    if func_name in ['health_check', 'debug_endpoint', 'system_debug']:
                        continue
                    
                    # Check if this route has response_model in the decorator
                    decorator_start = content.rfind('@router', 0, match.start())
                    decorator_end = match.end()
                    decorator_section = content[decorator_start:decorator_end]
                    
                    if not re.search(response_model_pattern, decorator_section):
                        missing_annotations.append({
                            "file": filename,
                            "function": func_name,
                            "method": method.upper(),
                            "line": line_start,
                            "severity": "medium"
                        })
            
            except Exception as e:
                print(f"⚠️  Warning: Could not check {file_path}: {e}")
        
        return missing_annotations
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        violations_by_type = {}
        violations_by_file = {}
        violations_by_severity = {"high": [], "medium": [], "low": []}
        
        for violation in self.violations:
            # Group by type
            if violation.violation_type not in violations_by_type:
                violations_by_type[violation.violation_type] = []
            violations_by_type[violation.violation_type].append(violation)
            
            # Group by file
            if violation.file_path not in violations_by_file:
                violations_by_file[violation.file_path] = []
            violations_by_file[violation.file_path].append(violation)
            
            # Group by severity
            violations_by_severity[violation.severity].append(violation)
        
        # Check response model annotations
        missing_annotations = self.check_response_model_annotations()
        
        # Calculate compliance percentage
        total_files = self.stats["files_scanned"]
        compliant_files = total_files - self.stats["files_with_violations"]
        compliance_percentage = (compliant_files / total_files * 100) if total_files > 0 else 0
        
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_files": total_files,
                "files_with_violations": self.stats["files_with_violations"],
                "total_violations": self.stats["violations_found"],
                "critical_violations": self.stats["critical_violations"],
                "compliance_percentage": round(compliance_percentage, 1),
                "missing_response_models": len(missing_annotations)
            },
            "violations_by_type": {
                vtype: len(vlist) for vtype, vlist in violations_by_type.items()
            },
            "violations_by_severity": {
                severity: len(vlist) for severity, vlist in violations_by_severity.items()
            },
            "top_violating_files": [
                {
                    "file": file_path,
                    "violations": len(file_violations),
                    "critical": len([v for v in file_violations if v.severity == "high"])
                }
                for file_path, file_violations in sorted(
                    violations_by_file.items(), 
                    key=lambda x: len(x[1]), 
                    reverse=True
                )[:10]
            ],
            "missing_response_models": missing_annotations,
            "recommendations": self._generate_recommendations(violations_by_type, missing_annotations)
        }
        
        return report
    
    def _generate_recommendations(self, violations_by_type: Dict, missing_annotations: List) -> List[str]:
        """Generate actionable recommendations based on violations found"""
        recommendations = []
        
        if "Direct HTTPException Usage" in violations_by_type:
            count = len(violations_by_type["Direct HTTPException Usage"])
            recommendations.append(
                f"🔧 Replace {count} direct HTTPException usages with proper exception handling patterns"
            )
        
        if "Direct Error Dict Return" in violations_by_type:
            count = len(violations_by_type["Direct Error Dict Return"])
            recommendations.append(
                f"📋 Convert {count} direct error returns to use HTTPException and contract format"
            )
        
        if missing_annotations:
            recommendations.append(
                f"📝 Add response_model annotations to {len(missing_annotations)} critical route handlers"
            )
        
        if not recommendations:
            recommendations.append("✅ All scanned files are contract compliant!")
        
        return recommendations
    
    def print_summary(self, verbose: bool = False):
        """Print a summary of findings to console"""
        report = self.generate_report()
        summary = report["summary"]
        
        print(f"\n📊 API Contract Enforcement Report")
        print(f"="*50)
        print(f"📁 Files scanned: {summary['total_files']}")
        print(f"⚠️  Files with violations: {summary['files_with_violations']}")
        print(f"🔍 Total violations: {summary['total_violations']}")
        print(f"🚨 Critical violations: {summary['critical_violations']}")
        print(f"📈 Contract compliance: {summary['compliance_percentage']}%")
        
        if summary['missing_response_models']:
            print(f"📝 Missing response models: {summary['missing_response_models']}")
        
        print(f"\n📋 Violations by type:")
        for vtype, count in report["violations_by_type"].items():
            severity_icon = "🚨" if count > 20 else "⚠️" if count > 5 else "🔍"
            print(f"  {severity_icon} {vtype}: {count}")
        
        if verbose and report["top_violating_files"]:
            print(f"\n📁 Top violating files:")
            for file_info in report["top_violating_files"][:5]:
                print(f"  📄 {file_info['file']}: {file_info['violations']} violations ({file_info['critical']} critical)")
        
        print(f"\n💡 Recommendations:")
        for rec in report["recommendations"]:
            print(f"  {rec}")
        
        if summary["critical_violations"] == 0:
            print(f"\n✅ No critical violations found!")
        else:
            print(f"\n⚠️  Found {summary['critical_violations']} critical violations that should be addressed")
    
    def save_report(self, output_path: Path):
        """Save detailed report to JSON file"""
        report = self.generate_report()
        
        # Add detailed violations for JSON report
        report["detailed_violations"] = [
            {
                "file": v.file_path,
                "line": v.line,
                "type": v.violation_type,
                "severity": v.severity,
                "match": v.match_text,
                "pattern": v.pattern
            }
            for v in self.violations
        ]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Detailed report saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="API Contract Enforcement Tool")
    parser.add_argument("--routes-dir", type=Path, default=Path("backend/routes"),
                       help="Path to routes directory")
    parser.add_argument("--report", type=Path, help="Save detailed JSON report to file")
    parser.add_argument("--threshold", type=int, default=500, 
                       help="Maximum allowed violations before failure")
    parser.add_argument("--critical-threshold", type=int, default=50,
                       help="Maximum allowed critical violations")
    parser.add_argument("--verbose", "-v", action="store_true", 
                       help="Show detailed output")
    parser.add_argument("--fail-on-violations", action="store_true",
                       help="Exit with error code if violations found")
    
    args = parser.parse_args()
    
    print("🔍 Starting API Contract Enforcement scan...")
    
    enforcer = APIContractEnforcer(args.routes_dir)
    violations = enforcer.scan_files()
    
    # Print summary
    enforcer.print_summary(verbose=args.verbose)
    
    # Save detailed report if requested
    if args.report:
        enforcer.save_report(args.report)
    
    # Check thresholds
    total_violations = len(violations)
    critical_violations = len([v for v in violations if v.severity == "high"])
    
    exit_code = 0
    
    if critical_violations > args.critical_threshold:
        print(f"\n❌ FAILED: {critical_violations} critical violations exceed threshold of {args.critical_threshold}")
        exit_code = 1
    
    if total_violations > args.threshold:
        print(f"\n❌ FAILED: {total_violations} total violations exceed threshold of {args.threshold}")
        exit_code = 1
    
    if args.fail_on_violations and total_violations > 0:
        print(f"\n❌ FAILED: Found {total_violations} violations (fail-on-violations enabled)")
        exit_code = 1
    
    if exit_code == 0 and total_violations > 0:
        print(f"\n⚠️  {total_violations} violations found but within acceptable thresholds")
        print("🎯 Goal: Reduce violations in future commits")
    elif exit_code == 0:
        print(f"\n✅ SUCCESS: No contract violations detected!")
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
