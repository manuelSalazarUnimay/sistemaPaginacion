from dataclasses import dataclass

@dataclass
class MemoryPage:
    page_number: int
    start_address: int
    end_address: int

    @property
    def start_address_hex(self) -> str:
        return hex(self.start_address).upper()

    @property
    def end_address_hex(self) -> str:
        return hex(self.end_address).upper()

@dataclass
class MemoryMapResult:
    total_pages: int
    page_size_bytes: int
    total_memory_bytes: int
    bus_bits: int
    pages_sample: list[MemoryPage]