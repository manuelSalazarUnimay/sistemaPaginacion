from typing import Optional
from pydantic import BaseModel, Field


class MemoryPageDTO(BaseModel):
    page_number: int = Field(..., description="Número ordinal de la página")
    start_address: int = Field(..., description="Dirección de memoria inicial (Decimal)")
    end_address: int = Field(..., description="Dirección de memoria final (Decimal)")
    start_address_hex: str = Field(..., description="Dirección inicial en Hexadecimal")
    end_address_hex: str = Field(..., description="Dirección final en Hexadecimal")


class PaginationResponseDTO(BaseModel):
    bus_bits: int = Field(..., description="Ancho de la arquitectura del bus en bits")
    total_pages: int = Field(..., description="Cantidad total de páginas direccionables")
    page_size_bytes: int = Field(..., description="Tamaño de cada página en bytes")
    page_size_kb: float = Field(..., description="Tamaño de cada página en KB")
    total_memory_bytes: int = Field(..., description="Capacidad total de memoria en bytes")
    total_memory_legible: str = Field(..., description="Capacidad total de memoria legible (ej: 4.00 GB)")
    pages_sample: list[MemoryPageDTO] = Field(..., description="Muestra previa de las primeras páginas")
    requested_page_detail: Optional[MemoryPageDTO] = Field(
        None,
        description="Detalle completo de la página específica si fue solicitada mediante query param"
    )