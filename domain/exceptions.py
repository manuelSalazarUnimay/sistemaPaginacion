class DomainException(Exception):
    """Base exception for all domain-level business errors."""
    pass


class InvalidInputException(DomainException):
    """Raised when input parameters or mathematical inputs are invalid."""
    pass


class PaginationException(DomainException):
    """Base exception for pagination operations."""
    pass


class PageOutOfBoundsException(PaginationException):
    """Raised when a requested page number is outside the valid range [0, total_pages - 1]."""

    def __init__(self, message: str, requested_page: int | None = None, total_pages: int | None = None):
        super().__init__(message)
        self.requested_page = requested_page
        self.total_pages = total_pages


class ArchitectureOverflowException(PaginationException):
    """Raised when requested pages exceed the addressing capacity of the bus architecture."""

    def __init__(self, message: str, required_bits: int, bus_bits: int, max_page: int, requested_page: int):
        super().__init__(message)
        self.required_bits = required_bits
        self.bus_bits = bus_bits
        self.max_page = max_page
        self.requested_page = requested_page