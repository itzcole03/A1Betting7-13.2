"""
Security Strict Mode Tests

Tests security strict mode functionality:
- Strict mode override behavior
- CSP enforcement when strict mode enabled
- Settings validation with strict mode
- Cross-field validation logic

Phase 1, Step 6: Security Headers Middleware - Strict Mode Tests
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.config.settings import SecuritySettings
from backend.middleware.security_headers import SecurityHeadersMiddleware


class TestSecurityStrictMode:
    """Test security strict mode configuration and behavior"""
    
    def test_strict_mode_forces_csp_enforcement(self):
        """Test that SECURITY_STRICT_MODE=True forces CSP_REPORT_ONLY=False"""
        # Test the model_validator behavior
        with patch.dict('os.environ', {
            'SECURITY_SECURITY_STRICT_MODE': 'true',
            'SECURITY_CSP_REPORT_ONLY': 'true'  # This should be overridden
        }):
            settings = SecuritySettings()
            
            # Strict mode should force CSP enforcement
            assert settings.security_strict_mode is True
            assert settings.csp_report_only is False  # Should be overridden to False
    
    def test_strict_mode_disabled_preserves_csp_report_only(self):
        """Test that SECURITY_STRICT_MODE=False preserves CSP_REPORT_ONLY setting"""
        with patch.dict('os.environ', {
            'SECURITY_SECURITY_STRICT_MODE': 'false',
            'SECURITY_CSP_REPORT_ONLY': 'true'
        }):
            settings = SecuritySettings()
            
            assert settings.security_strict_mode is False
            assert settings.csp_report_only is True  # Should preserve original value
    
    def test_strict_mode_forces_csp_enforcement_middleware(self):
        """Test middleware behavior with strict mode forcing CSP enforcement"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            security_strict_mode=True,
            csp_report_only=True  # This should be overridden by strict mode
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        # Should use enforce mode, not report-only mode
        csp_header_name, _ = middleware._build_csp_header()
        assert csp_header_name == "Content-Security-Policy"
        assert csp_header_name != "Content-Security-Policy-Report-Only"
    
    def test_strict_mode_csp_integration(self):
        """Test CSP header application with strict mode enabled"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            security_strict_mode=True,
            csp_report_only=True  # This should be overridden
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Should have enforcing CSP header, not report-only
        assert "Content-Security-Policy" in response.headers
        assert "Content-Security-Policy-Report-Only" not in response.headers
        
        csp_header = response.headers["Content-Security-Policy"]
        assert "default-src 'self'" in csp_header
    
    def test_non_strict_mode_respects_report_only(self):
        """Test that non-strict mode respects CSP report-only setting"""
        app = FastAPI()
        
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=True,
            security_strict_mode=False,
            csp_report_only=True
        )
        
        app.add_middleware(SecurityHeadersMiddleware, settings=settings)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        
        # Should have report-only CSP header
        assert "Content-Security-Policy-Report-Only" in response.headers
        assert "Content-Security-Policy" not in response.headers
    
    @patch('logging.getLogger')
    def test_strict_mode_logging(self, mock_logger):
        """Test that strict mode logs configuration override"""
        mock_logger_instance = Mock()
        mock_logger.return_value = mock_logger_instance
        
        # Test with strict mode enabled and report-only originally true
        with patch.dict('os.environ', {
            'SECURITY_SECURITY_STRICT_MODE': 'true',
            'SECURITY_CSP_REPORT_ONLY': 'true'
        }):
            settings = SecuritySettings()
            
            # Should log the override
            mock_logger_instance.info.assert_called_with(
                "SECURITY_STRICT_MODE enabled: forcing CSP_REPORT_ONLY=False for enforcement"
            )
            
            assert settings.security_strict_mode is True
            assert settings.csp_report_only is False
    
    def test_strict_mode_with_csp_disabled(self):
        """Test strict mode behavior when CSP is disabled"""
        settings = SecuritySettings(
            security_headers_enabled=True,
            csp_enabled=False,  # CSP disabled
            security_strict_mode=True
        )
        
        app = FastAPI()
        middleware = SecurityHeadersMiddleware(app, settings)
        
        # CSP should remain disabled even in strict mode
        csp_header_name, csp_header_value = middleware._build_csp_header()
        assert csp_header_name is None
        assert csp_header_value is None
    
    def test_strict_mode_environment_variable_parsing(self):
        """Test that strict mode correctly parses environment variables"""
        # Test various truthy values
        truthy_values = ['true', 'True', 'TRUE', '1', 'yes', 'on']
        falsy_values = ['false', 'False', 'FALSE', '0', 'no', 'off', '']
        
        for value in truthy_values:
            with patch.dict('os.environ', {'SECURITY_SECURITY_STRICT_MODE': value}):
                settings = SecuritySettings()
                assert settings.security_strict_mode is True, f"Failed for truthy value: {value}"
        
        for value in falsy_values:
            with patch.dict('os.environ', {'SECURITY_SECURITY_STRICT_MODE': value}):
                settings = SecuritySettings()
                assert settings.security_strict_mode is False, f"Failed for falsy value: {value}"


class TestSettingsValidation:
    """Test settings validation with strict mode"""
    
    @patch('logging.getLogger')
    def test_csp_report_only_warning_when_endpoint_disabled(self, mock_logger):
        """Test warning when CSP report-only is enabled but endpoint is disabled"""
        mock_logger_instance = Mock()
        mock_logger.return_value = mock_logger_instance
        
        with patch.dict('os.environ', {
            'SECURITY_CSP_REPORT_ONLY': 'true',
            'SECURITY_CSP_REPORT_ENDPOINT_ENABLED': 'false'
        }):
            settings = SecuritySettings()
            
            # Should log misconfiguration warning
            mock_logger_instance.warning.assert_called_with(
                "Configuration warning: CSP_REPORT_ONLY=True but CSP_REPORT_ENDPOINT_ENABLED=False - reports will be lost"
            )
            
            assert settings.csp_report_only is True
            assert settings.csp_report_endpoint_enabled is False
    
    def test_x_frame_options_validation(self):
        """Test X-Frame-Options validation"""
        # Valid values
        for valid_value in ['DENY', 'deny', 'SAMEORIGIN', 'sameorigin']:
            settings = SecuritySettings(x_frame_options=valid_value)
            assert settings.x_frame_options in ['DENY', 'SAMEORIGIN']
        
        # Invalid values should raise validation error
        with pytest.raises(ValueError, match="X-Frame-Options must be either 'DENY' or 'SAMEORIGIN'"):
            SecuritySettings(x_frame_options='INVALID')
    
    def test_secret_key_validation(self):
        """Test secret key length validation"""
        # Valid secret key (32+ characters)
        valid_key = "a" * 32
        settings = SecuritySettings(secret_key=valid_key)
        assert settings.secret_key == valid_key
        
        # Invalid secret key (too short)
        with pytest.raises(ValueError, match="Secret key must be at least 32 characters long"):
            SecuritySettings(secret_key="short")


class TestStrictModeIntegrationScenarios:
    """Test strict mode in various integration scenarios"""
    
    def test_production_strict_mode_scenario(self):
        """Test typical production configuration with strict mode"""
        with patch.dict('os.environ', {
            'SECURITY_SECURITY_STRICT_MODE': 'true',
            'SECURITY_SECURITY_HEADERS_ENABLED': 'true',
            'SECURITY_ENABLE_HSTS': 'true',
            'SECURITY_CSP_ENABLED': 'true',
            'SECURITY_CSP_REPORT_ONLY': 'true',  # Should be overridden
            'SECURITY_ENABLE_COOP': 'true',
            'SECURITY_ENABLE_COEP': 'true',
            'SECURITY_X_FRAME_OPTIONS': 'DENY'
        }):
            settings = SecuritySettings()
            
            # Verify strict mode overrides
            assert settings.security_strict_mode is True
            assert settings.csp_report_only is False  # Overridden to enforce mode
            
            # Verify other security settings remain as configured
            assert settings.security_headers_enabled is True
            assert settings.enable_hsts is True
            assert settings.csp_enabled is True
            assert settings.enable_coop is True
            assert settings.enable_coep is True
            assert settings.x_frame_options == "DENY"
    
    def test_development_non_strict_mode_scenario(self):
        """Test typical development configuration without strict mode"""
        with patch.dict('os.environ', {
            'SECURITY_SECURITY_STRICT_MODE': 'false',
            'SECURITY_SECURITY_HEADERS_ENABLED': 'true',
            'SECURITY_CSP_ENABLED': 'true',
            'SECURITY_CSP_REPORT_ONLY': 'true',  # Should be preserved
            'SECURITY_ENABLE_HSTS': 'false'  # Disabled in development
        }):
            settings = SecuritySettings()
            
            assert settings.security_strict_mode is False
            assert settings.csp_report_only is True  # Preserved for safe development
            assert settings.csp_enabled is True
            assert settings.enable_hsts is False
    
    def test_strict_mode_with_custom_connect_sources(self):
        """Test strict mode with custom CSP connect sources"""
        with patch.dict('os.environ', {
            'SECURITY_SECURITY_STRICT_MODE': 'true',
            'SECURITY_CSP_ENABLED': 'true',
            'SECURITY_CSP_REPORT_ONLY': 'true',
            'SECURITY_CSP_EXTRA_CONNECT_SRC': 'https://api.production.com, wss://ws.production.com'
        }):
            settings = SecuritySettings()
            
            app = FastAPI()
            app.add_middleware(SecurityHeadersMiddleware, settings=settings)
            
            @app.get("/test")
            async def test_endpoint():
                return {"message": "test"}
            
            client = TestClient(app)
            response = client.get("/test")
            
            # Should enforce CSP despite original report-only setting
            assert "Content-Security-Policy" in response.headers
            csp_header = response.headers["Content-Security-Policy"]
            assert "connect-src 'self' https://api.production.com wss://ws.production.com" in csp_header
