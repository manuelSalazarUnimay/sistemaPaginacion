from enum import Enum
from dataclasses import dataclass, field


class PageSizeUnit(str, Enum):
    """Unidades de medida soportadas para el tamaño de página."""
    BYTES = "B"
    KB = "KB"
    MB = "MB"
    GB = "GB"

    @property
    def bytes_multiplier(self) -> int:
        multipliers = {
            PageSizeUnit.BYTES: 1,
            PageSizeUnit.KB: 1024,
            PageSizeUnit.MB: 1024 ** 2,
            PageSizeUnit.GB: 1024 ** 3,
        }
        return multipliers[self]


@dataclass(frozen=True)
class MemoryPage:
    """Representación de una página individual de memoria y sus rangos de dirección."""
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
    """Representa un paso dentro de la traza explicativa didáctica."""
    step_number: int
    title: str
    explanation: str
    formula: str
    result_summary: str


@dataclass(frozen=True)
class SegmentationInfo:
    """Metadatos arquitectónicos de segmentación de la memoria."""
    bus_bits: int
    page_size_val: float
    page_size_unit: PageSizeUnit
    page_size_bytes: int
    offset_bits: int
    vpn_bits: int
    max_supported_pages: int
    total_memory_bytes: int

    @property
    def page_size_kb(self) -> float:
        """Propiedad de compatibilidad hacia atrás."""
        return self.page_size_bytes / 1024.0


@dataclass
class PageRangeAnalysis:
    """Resultado completo del análisis de rango de páginas con traza didáctica."""
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


MemoryMapResult = PageRangeAnalysis