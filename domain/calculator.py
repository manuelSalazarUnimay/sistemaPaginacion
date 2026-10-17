import math
from domain.exceptions import InvalidInputException, PageOutOfBoundsException
from domain.models import MemoryPage, MemoryMapResult


class PaginationCalculator:

    @staticmethod
    def bytes_to_legible(size_bytes: int) -> str:
        if size_bytes >= 1024 ** 3:
            return f"{size_bytes / (1024 ** 3):.2f} GB"
        elif size_bytes >= 1024 ** 2:
            return f"{size_bytes / (1024 ** 2):.2f} MB"
        elif size_bytes >= 1024:
            return f"{size_bytes / 1024:.2f} KB"
        return f"{size_bytes} Bytes"

    @staticmethod
    def calculate_specific_page(page_number: int, total_pages: int, page_size_bytes: int) -> MemoryPage:
        if page_number < 0 or page_number >= total_pages:
            raise PageOutOfBoundsException(
                f"La página {page_number} está fuera de rango. Debe estar entre 0 y {total_pages - 1}."
            )

        start_address = page_number * page_size_bytes
        end_address = start_address + page_size_bytes - 1
        return MemoryPage(
            page_number=page_number,
            start_address=start_address,
            end_address=end_address
        )

    @staticmethod
    def calculate_by_bus_and_page_size(bus_bits: int, page_size_kb: float) -> MemoryMapResult:
        if bus_bits <= 0 or page_size_kb <= 0:
            raise InvalidInputException("Los valores ingresados deben ser mayores a cero.")

        total_memory = 2 ** bus_bits
        page_size_bytes = int(page_size_kb * 1024)
        total_pages = total_memory // page_size_bytes

        pages_sample = PaginationCalculator._generate_sample_pages(total_pages, page_size_bytes)
        return MemoryMapResult(
            total_pages=total_pages,
            page_size_bytes=page_size_bytes,
            total_memory_bytes=total_memory,
            bus_bits=bus_bits,
            pages_sample=pages_sample
        )

    @staticmethod
    def calculate_by_bus_and_total_pages(bus_bits: int, total_pages: int) -> MemoryMapResult:
        if bus_bits <= 0 or total_pages <= 0:
            raise InvalidInputException("Los valores ingresados deben ser mayores a cero.")

        total_memory = 2 ** bus_bits
        page_size_bytes = total_memory // total_pages

        pages_sample = PaginationCalculator._generate_sample_pages(total_pages, page_size_bytes)
        return MemoryMapResult(
            total_pages=total_pages,
            page_size_bytes=page_size_bytes,
            total_memory_bytes=total_memory,
            bus_bits=bus_bits,
            pages_sample=pages_sample
        )

    @staticmethod
    def calculate_by_pages_and_page_size(total_pages: int, page_size_kb: float) -> MemoryMapResult:
        if total_pages <= 0 or page_size_kb <= 0:
            raise InvalidInputException("Los valores ingresados deben ser mayores a cero.")

        page_size_bytes = int(page_size_kb * 1024)
        required_memory = total_pages * page_size_bytes

        bus_bits = math.ceil(math.log2(required_memory)) if required_memory > 0 else 0

        pages_sample = PaginationCalculator._generate_sample_pages(total_pages, page_size_bytes)
        return MemoryMapResult(
            total_pages=total_pages,
            page_size_bytes=page_size_bytes,
            total_memory_bytes=required_memory,
            bus_bits=bus_bits,
            pages_sample=pages_sample
        )

    @staticmethod
    def _generate_sample_pages(total_pages: int, page_size_bytes: int, sample_limit: int = 16) -> list[MemoryPage]:
        limit = min(total_pages, sample_limit)
        sample = []
        for i in range(limit):
            page = PaginationCalculator.calculate_specific_page(i, total_pages, page_size_bytes)
            sample.append(page)
        return sample