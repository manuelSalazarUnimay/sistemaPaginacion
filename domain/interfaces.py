from abc import ABC, abstractmethod
from domain.models import MemoryPage, SegmentationInfo, PageRangeAnalysis


class ISegmentationAnalyzer(ABC):
    """Contract for bus and page segmentation analysis."""

    @abstractmethod
    def analyze(self, bus_bits: int, page_size_kb: float) -> SegmentationInfo:
        pass


class IPaginationCalculator(ABC):
    """Contract for core pagination calculation and didactic analysis."""

    @abstractmethod
    def calculate_specific_page(self, page_number: int, total_pages: int, page_size_bytes: int) -> MemoryPage:
        pass

    @abstractmethod
    def calculate_range_didactic(
        self, bus_bits: int, page_size_kb: float, start_page: int, end_page: int
    ) -> PageRangeAnalysis:
        pass

    @abstractmethod
    def calculate_by_bus_and_page_size(self, bus_bits: int, page_size_kb: float) -> PageRangeAnalysis:
        pass

    @abstractmethod
    def calculate_by_bus_and_total_pages(self, bus_bits: int, total_pages: int) -> PageRangeAnalysis:
        pass

    @abstractmethod
    def calculate_by_pages_and_page_size(self, total_pages: int, page_size_kb: float) -> PageRangeAnalysis:
        pass