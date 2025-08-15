"""
Test for error code validation

This test validates that all API error codes are unique and properly defined.
"""

from __future__ import annotations

import pytest
from backend.constants.error_codes import (
    APIErrorCode,
    validate_error_code_uniqueness,
    get_all_error_codes,
    is_valid_error_code,
)


class TestErrorCodes:
    """Test error code functionality"""

    def test_error_code_uniqueness(self) -> None:
        """Test that all error codes are unique"""
        assert validate_error_code_uniqueness(), "Error codes are not unique"

    def test_all_error_codes_returned(self) -> None:
        """Test that all error codes are returned by get_all_error_codes"""
        error_codes = get_all_error_codes()
        enum_codes = [code.value for code in APIErrorCode]
        
        assert len(error_codes) > 0, "No error codes returned"
        assert error_codes == enum_codes, "get_all_error_codes doesn't match enum values"

    def test_valid_error_code_validation(self) -> None:
        """Test that valid error codes are recognized"""
        # Test a few known error codes
        assert is_valid_error_code("VALIDATION_ERROR")
        assert is_valid_error_code("AUTHENTICATION_REQUIRED")
        assert is_valid_error_code("OPERATION_FAILED")

    def test_invalid_error_code_validation(self) -> None:
        """Test that invalid error codes are rejected"""
        assert not is_valid_error_code("INVALID_CODE")
        assert not is_valid_error_code("")
        assert not is_valid_error_code("NOT_A_REAL_ERROR")

    def test_error_code_enum_values(self) -> None:
        """Test that enum values match expected strings"""
        assert APIErrorCode.VALIDATION_ERROR.value == "VALIDATION_ERROR"
        assert APIErrorCode.AUTHENTICATION_REQUIRED.value == "AUTHENTICATION_REQUIRED"
        assert APIErrorCode.OPERATION_FAILED.value == "OPERATION_FAILED"

    def test_no_duplicate_enum_values(self) -> None:
        """Test that enum values are not duplicated"""
        values = [code.value for code in APIErrorCode]
        unique_values = set(values)
        
        assert len(values) == len(unique_values), f"Found duplicate error codes: {values}"

    def test_error_codes_follow_naming_convention(self) -> None:
        """Test that error codes follow the naming convention (UPPER_CASE_WITH_UNDERSCORES)"""
        for code in APIErrorCode:
            value = code.value
            assert value.isupper(), f"Error code {value} is not uppercase"
            assert "_" in value or value.isalpha(), f"Error code {value} doesn't follow naming convention"
            assert " " not in value, f"Error code {value} contains spaces"
