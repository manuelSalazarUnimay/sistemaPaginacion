from domain.interfaces import IPaginationCalculator
from domain.calculator import PaginationCalculator
from domain.models import MemoryPage, PageRangeAnalysis


class PaginationService:
    """Application Service orchestrating use cases for memory pagination."""

    def __init__(self, calculator: IPaginationCalculator | None = None):
        self.calculator = calculator or PaginationCalculator()

    def get_pages_from_bus_and_size(self, bus_bits: int, page_size_kb: float) -> PageRangeAnalysis:
        return self.calculator.calculate_by_bus_and_page_size(bus_bits, page_size_kb)

    def get_size_from_bus_and_pages(self, bus_bits: int, total_pages: int) -> PageRangeAnalysis:
        return self.calculator.calculate_by_bus_and_total_pages(bus_bits, total_pages)

    def get_bus_from_pages_and_size(self, total_pages: int, page_size_kb: float) -> PageRangeAnalysis:
        return self.calculator.calculate_by_pages_and_page_size(total_pages, page_size_kb)

    def get_page_detail(self, result: PageRangeAnalysis, page_number: int) -> MemoryPage:
        return self.calculator.calculate_specific_page(
            page_number=page_number,
            total_pages=result.segmentation.max_supported_pages,
            page_size_bytes=result.segmentation.page_size_bytes
        )

    def get_didactic_page_range(
        self, bus_bits: int, page_size_kb: float, start_page: int, end_page: int
    ) -> PageRangeAnalysis:
        return self.calculator.calculate_range_didactic(
            bus_bits=bus_bits,
            page_size_kb=page_size_kb,
            start_page=start_page,
            end_page=end_page
        )