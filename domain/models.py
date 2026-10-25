from dataclasses import dataclass, field


@dataclass(frozen=True)
class MemoryPage:
    """Representation of an individual memory page and its address ranges."""
    page_number: int
    start_address: int
    end_address: int

    @property
    def start_address_hex(self) -> str:
        return hex(self.start_address).upper()

    @property
    def end_address_hex(self) -> str:
        return hex(self.end_address).upper()


@dataclass(frozen=True)
class DidacticStep:
    """Represents a single step in the explanatory didactic trace."""
    step_number: int
    title: str
    explanation: str
    formula: str
    result_summary: str


@dataclass(frozen=True)
class SegmentationInfo:
    """Architectural segmentation metadata for the memory bus."""
    bus_bits: int
    page_size_bytes: int
    page_size_kb: float
    offset_bits: int
    vpn_bits: int
    max_supported_pages: int
    total_memory_bytes: int


@dataclass
class PageRangeAnalysis:
    """Complete result of a page range calculation with didactic trace."""
    start_page: int
    end_page: int
    segmentation: SegmentationInfo
    pages_sample: list[MemoryPage] = field(default_factory=list)
    steps: list[DidacticStep] = field(default_factory=list)

    @property
    def total_pages_in_block(self) -> int:
        return (self.end_page - self.start_page) + 1

    @property
    def start_address_dec(self) -> int:
        return self.pages_sample[0].start_address if self.pages_sample else 0

    @property
    def end_address_dec(self) -> int:
        return self.pages_sample[-1].end_address if self.pages_sample else 0

    @property
    def start_address_hex(self) -> str:
        return hex(self.start_address_dec).upper()

    @property
    def end_address_hex(self) -> str:
        return hex(self.end_address_dec).upper()


# Alias for backward compatibility
MemoryMapResult = PageRangeAnalysis