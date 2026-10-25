from typing import Optional
from pydantic import BaseModel, Field


class MemoryPageDTO(BaseModel):
    page_number: int = Field(..., description="Número ordinal de la página")
    start_address: int = Field(..., description="Dirección de memoria inicial (Decimal)")
    end_address: int = Field(..., description="Dirección de memoria final (Decimal)")
    start_address_hex: str = Field(..., description="Dirección inicial en Hexadecimal")
    end_address_hex: str = Field(..., description="Dirección final en Hexadecimal")


class SegmentationInfoDTO(BaseModel):
    bus_bits: int = Field(..., description="Ancho de bus en bits")
    page_size_bytes: int = Field(..., description="Tamaño de página en bytes")
    page_size_kb: float = Field(..., description="Tamaño de página en KB")
    offset_bits: int = Field(..., description="Bits asignados al desplazamiento (Offset)")
    vpn_bits: int = Field(..., description="Bits asignados al número de página (VPN)")
    max_supported_pages: int = Field(..., description="Cantidad máxima de páginas direccionables")
    total_memory_bytes: int = Field(..., description="Capacidad total de memoria direccionable en bytes")


class DidacticStepDTO(BaseModel):
    step_number: int = Field(..., description="Número de paso explicativo")
    title: str = Field(..., description="Título del paso")
    explanation: str = Field(..., description="Explicación detallada")
    formula: str = Field(..., description="Fórmula matemática aplicada")
    result_summary: str = Field(..., description="Resumen del resultado obtenido")


class PaginationResponseDTO(BaseModel):
    bus_bits: int = Field(..., description="Ancho de la arquitectura del bus en bits")
    total_pages: int = Field(..., description="Cantidad total de páginas direccionables")
    page_size_bytes: int = Field(..., description="Tamaño de cada página en bytes")
    page_size_kb: float = Field(..., description="Tamaño de cada página en KB")
    total_memory_bytes: int = Field(..., description="Capacidad total de memoria en bytes")
    total_memory_legible: str = Field(..., description="Capacidad total de memoria legible (ej: 4.00 GB)")
    pages_sample: list[MemoryPageDTO] = Field(..., description="Muestra previa de páginas")
    requested_page_detail: Optional[MemoryPageDTO] = Field(
        None, description="Detalle de página específica solicitada"
    )
    segmentation: Optional[SegmentationInfoDTO] = Field(
        None, description="Metadata arquitectónica de segmentación y VPN"
    )


class PageRangeResponseDTO(BaseModel):
    start_page: int = Field(..., description="Página inicial del rango")
    end_page: int = Field(..., description="Página final del rango")
    total_pages_in_block: int = Field(..., description="Total de páginas en el bloque analizado")
    start_address_dec: int = Field(..., description="Dirección de inicio en decimal")
    end_address_dec: int = Field(..., description="Dirección de fin en decimal")
    start_address_hex: str = Field(..., description="Dirección de inicio en hexadecimal")
    end_address_hex: str = Field(..., description="Dirección de fin en hexadecimal")
    segmentation: SegmentationInfoDTO = Field(..., description="Detalles de segmentación del bus")
    pages_sample: list[MemoryPageDTO] = Field(..., description="Muestra de páginas dentro del bloque")
    steps: list[DidacticStepDTO] = Field(..., description="Pasos explicativos paso a paso")