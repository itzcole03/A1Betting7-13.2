from fastapi import HTTPException, status


class BusinessLogicException(HTTPException):
    def __init__(
        self,
        detail="Business logic error",
        error_code="business_error",
        status_code=status.HTTP_400_BAD_REQUEST,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class ValidationException(HTTPException):
    def __init__(
        self,
        detail="Validation error",
        error_code="validation_error",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class AuthorizationException(HTTPException):
    def __init__(
        self,
        detail="Authorization error",
        error_code="authorization_error",
        status_code=status.HTTP_401_UNAUTHORIZED,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
