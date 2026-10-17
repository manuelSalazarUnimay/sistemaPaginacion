from domain.calculator import PaginationCalculator
from domain.models import MemoryMapResult

class PaginationService:
    def __init__(self):
        self.calculator = PaginationCalculator()

    def get_pages_from_bus_and_size(self, bus_bits: int, page_size_kb: float) -> MemoryMapResult:
        return self.calculator.calculate_by_bus_and_page_size(bus_bits, page_size_kb)

    def get_size_from_bus_and_pages(self, bus_bits: int, total_pages: int) -> MemoryMapResult:
        return self.calculator.calculate_by_bus_and_total_pages(bus_bits, total_pages)

    def get_bus_from_pages_and_size(self, total_pages: int, page_size_kb: float) -> MemoryMapResult:
        return self.calculator.calculate_by_pages_and_page_size(total_pages, page_size_kb)