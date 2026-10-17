from domain.calculator import PaginationCalculator
from domain.models import MemoryMapResult, MemoryPage

class PaginationService:
    def __init__(self):
        self.calculator = PaginationCalculator()

    def get_pages_from_bus_and_size(self, bus_bits: int, page_size_kb: float) -> MemoryMapResult:
        return self.calculator.calculate_by_bus_and_page_size(bus_bits, page_size_kb)

    def get_size_from_bus_and_pages(self, bus_bits: int, total_pages: int) -> MemoryMapResult:
        return self.calculator.calculate_by_bus_and_total_pages(bus_bits, total_pages)

    def get_bus_from_pages_and_size(self, total_pages: int, page_size_kb: float) -> MemoryMapResult:
        return self.calculator.calculate_by_pages_and_page_size(total_pages, page_size_kb)

    def get_page_detail(self, result: MemoryMapResult, page_number: int) -> MemoryPage:
        """Delega al dominio el cálculo exacto de la página solicitada."""
        return self.calculator.calculate_specific_page(
            page_number=page_number,
            total_pages=result.total_pages,
            page_size_bytes=result.page_size_bytes
        )