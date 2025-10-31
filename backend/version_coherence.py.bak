"""
Version coherence module for A1Betting application

Provides version information and compatibility checking between
frontend and backend components.
"""

from datetime import datetime
from typing import Dict, Any, Optional
import re

# Application version information
APP_VERSION = "7.13.2"
BUILD_DATE = "2024-12-30"
BUILD_NUMBER = "20241230.001"
COMMIT_HASH = "HEAD"  # Should be replaced by CI/CD

# API version for compatibility checking
API_VERSION = "2.1.0"
MIN_FRONTEND_VERSION = "7.13.0"
MIN_BACKEND_VERSION = "7.13.0"

# Feature compatibility matrix
FEATURE_COMPATIBILITY = {
    "websocket_v2": "7.13.2",
    "realtime_enhancements": "7.13.2", 
    "unified_logging": "7.13.1",
    "comprehensive_props": "7.12.0",
    "modern_ml": "7.11.0"
}

# Version metadata
VERSION_METADATA = {
    "name": "A1Betting Sports Analytics Platform",
    "description": "AI-powered sports betting analytics with real-time data",
    "maintainer": "A1Betting Engineering Team",
    "license": "Proprietary",
    "homepage": "https://a1betting.com",
    "repository": "https://github.com/a1betting/platform"
}


class VersionInfo:
    """Version information container with comparison utilities"""
    
    def __init__(
        self,
        version: str,
        build_date: str = BUILD_DATE,
        build_number: str = BUILD_NUMBER,
        commit_hash: str = COMMIT_HASH
    ):
        self.version = version
        self.build_date = build_date
        self.build_number = build_number
        self.commit_hash = commit_hash
        
        # Parse semantic version
        self.major, self.minor, self.patch = self._parse_semver(version)
    
    @staticmethod
    def _parse_semver(version: str) -> tuple[int, int, int]:
        """Parse semantic version string into components"""
        match = re.match(r'^(\d+)\.(\d+)\.(\d+)', version)
        if not match:
            raise ValueError(f"Invalid semantic version: {version}")
        return int(match.group(1)), int(match.group(2)), int(match.group(3))
    
    def is_compatible_with(self, other_version: str, min_version: Optional[str] = None) -> bool:
        """Check if this version is compatible with another version"""
        try:
            other_major, other_minor, other_patch = self._parse_semver(other_version)
            
            # Major version must match for compatibility
            if self.major != other_major:
                return False
            
            # Check minimum version requirement if specified
            if min_version:
                min_major, min_minor, min_patch = self._parse_semver(min_version)
                
                # Current version must meet minimum requirements
                if (self.major, self.minor, self.patch) < (min_major, min_minor, min_patch):
                    return False
            
            return True
            
        except ValueError:
            return False
    
    def is_newer_than(self, other_version: str) -> bool:
        """Check if this version is newer than another version"""
        try:
            other_major, other_minor, other_patch = self._parse_semver(other_version)
            return (self.major, self.minor, self.patch) > (other_major, other_minor, other_patch)
        except ValueError:
            return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert version info to dictionary"""
        return {
            "version": self.version,
            "major": self.major,
            "minor": self.minor,
            "patch": self.patch,
            "build_date": self.build_date,
            "build_number": self.build_number,
            "commit_hash": self.commit_hash
        }
    
    def __str__(self) -> str:
        return f"{self.version} (build {self.build_number})"
    
    def __repr__(self) -> str:
        return f"VersionInfo(version='{self.version}', build='{self.build_number}')"


# Global version instances
CURRENT_VERSION = VersionInfo(APP_VERSION, BUILD_DATE, BUILD_NUMBER, COMMIT_HASH)
API_VERSION_INFO = VersionInfo(API_VERSION)


def get_version_info() -> Dict[str, Any]:
    """Get comprehensive version information"""
    return {
        "app": CURRENT_VERSION.to_dict(),
        "api": API_VERSION_INFO.to_dict(),
        "compatibility": {
            "min_frontend_version": MIN_FRONTEND_VERSION,
            "min_backend_version": MIN_BACKEND_VERSION,
            "features": FEATURE_COMPATIBILITY
        },
        "metadata": VERSION_METADATA,
        "timestamp": datetime.utcnow().isoformat(),
        "build_info": {
            "environment": "production",  # Should be set by deployment
            "platform": "python",
            "python_version": "3.12+"
        }
    }


def check_version_compatibility(
    frontend_version: str,
    backend_version: str
) -> Dict[str, Any]:
    """Check compatibility between frontend and backend versions"""
    
    frontend_info = VersionInfo(frontend_version)
    backend_info = VersionInfo(backend_version)
    
    # Check basic compatibility
    frontend_compatible = frontend_info.is_compatible_with(
        backend_version, 
        MIN_FRONTEND_VERSION
    )
    backend_compatible = backend_info.is_compatible_with(
        frontend_version,
        MIN_BACKEND_VERSION
    )
    
    # Check feature compatibility
    compatible_features = []
    incompatible_features = []
    
    for feature, required_version in FEATURE_COMPATIBILITY.items():
        if (frontend_info.is_compatible_with(required_version) and 
            backend_info.is_compatible_with(required_version)):
            compatible_features.append(feature)
        else:
            incompatible_features.append({
                "feature": feature,
                "required_version": required_version,
                "frontend_version": frontend_version,
                "backend_version": backend_version
            })
    
    overall_compatible = frontend_compatible and backend_compatible
    
    return {
        "compatible": overall_compatible,
        "frontend_compatible": frontend_compatible,
        "backend_compatible": backend_compatible,
        "frontend_version": frontend_version,
        "backend_version": backend_version,
        "min_requirements": {
            "frontend": MIN_FRONTEND_VERSION,
            "backend": MIN_BACKEND_VERSION
        },
        "features": {
            "compatible": compatible_features,
            "incompatible": incompatible_features
        },
        "recommendations": _get_compatibility_recommendations(
            frontend_info, backend_info, overall_compatible
        ),
        "timestamp": datetime.utcnow().isoformat()
    }


def _get_compatibility_recommendations(
    frontend_info: VersionInfo,
    backend_info: VersionInfo,
    compatible: bool
) -> list[str]:
    """Generate compatibility recommendations"""
    recommendations = []
    
    if not compatible:
        recommendations.append("Version compatibility issues detected")
        
        # Check if frontend is too old
        if not frontend_info.is_compatible_with(MIN_FRONTEND_VERSION):
            recommendations.append(f"Frontend version {frontend_info.version} is too old. Minimum required: {MIN_FRONTEND_VERSION}")
        
        # Check if backend is too old
        if not backend_info.is_compatible_with(MIN_BACKEND_VERSION):
            recommendations.append(f"Backend version {backend_info.version} is too old. Minimum required: {MIN_BACKEND_VERSION}")
        
        # Check major version mismatches
        if frontend_info.major != backend_info.major:
            recommendations.append("Major version mismatch detected. Consider upgrading to matching major versions.")
    else:
        recommendations.append("Versions are compatible")
        
        # Suggest upgrades for newer features
        for feature, required_version in FEATURE_COMPATIBILITY.items():
            if not frontend_info.is_compatible_with(required_version):
                recommendations.append(f"Upgrade to {required_version}+ to enable {feature}")
    
    return recommendations


def get_build_info() -> Dict[str, Any]:
    """Get detailed build information"""
    return {
        "version": APP_VERSION,
        "build_date": BUILD_DATE,
        "build_number": BUILD_NUMBER,
        "commit_hash": COMMIT_HASH,
        "api_version": API_VERSION,
        "features": list(FEATURE_COMPATIBILITY.keys()),
        "compatibility_matrix": FEATURE_COMPATIBILITY
    }


# Export main interfaces
__all__ = [
    "APP_VERSION",
    "API_VERSION", 
    "BUILD_DATE",
    "BUILD_NUMBER",
    "COMMIT_HASH",
    "CURRENT_VERSION",
    "API_VERSION_INFO",
    "VersionInfo",
    "get_version_info",
    "check_version_compatibility",
    "get_build_info",
    "FEATURE_COMPATIBILITY",
    "VERSION_METADATA"
]