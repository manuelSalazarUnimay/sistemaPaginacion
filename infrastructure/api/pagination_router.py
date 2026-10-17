from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status

from application.pagination_service import PaginationService
from domain.calculator import PaginationCalculator
from domain.exceptions import DomainException, PageOutOfBoundsException, InvalidInputException
from infrastructure.api.dtos import PaginationResponseDTO, MemoryPageDTO

router = APIRouter(prefix="/api/v1/pagination", tags=["Simulador de Paginación"])
service = PaginationService()


def _build_response_dto(result, requested_page: Optional[int] = None) -> PaginationResponseDTO:
    """Helper para transformar el resultado del dominio en el DTO de respuesta de la API."""
    pages_sample_dto = [
        MemoryPageDTO(
            page_number=p.page_number,
            start_address=p.start_address,
            end_address=p.end_address,
            start_address_hex=p.start_address_hex,
            end_address_hex=p.end_address_hex
        )
        for p in result.pages_sample
    ]

    requested_page_dto = None
    if requested_page is not None:
        # Reutilizamos el servicio de aplicación para obtener el detalle de la página
        page_detail = service.get_page_detail(result, requested_page)
        requested_page_dto = MemoryPageDTO(
            page_number=page_detail.page_number,
            start_address=page_detail.start_address,
            end_address=page_detail.end_address,
            start_address_hex=page_detail.start_address_hex,
            end_address_hex=page_detail.end_address_hex
        )

    return PaginationResponseDTO(
        bus_bits=result.bus_bits,
        total_pages=result.total_pages,
        page_size_bytes=result.page_size_bytes,
        page_size_kb=round(result.page_size_bytes / 1024, 2),
        total_memory_bytes=result.total_memory_bytes,
        total_memory_legible=PaginationCalculator.bytes_to_legible(result.total_memory_bytes),
        pages_sample=pages_sample_dto,
        requested_page_detail=requested_page_dto
    )


@router.get(
    "/pages-from-bus",
    response_model=PaginationResponseDTO,
    summary="1. [Bus] + [Anchura Página] --> Calcular Número de Páginas",
    description="Calcula el número total de páginas y mapa de memoria a partir de los bits del bus y el tamaño de página en KB."
)
def get_pages_from_bus_and_size(
    bus_bits: int = Query(..., ge=1, le=128, description="Arquitectura del Bus en bits (ej: 16, 32, 64)"),
    page_size_kb: float = Query(..., gt=0, description="Tamaño o anchura de página en KB (ej: 4.0)"),
    requested_page: Optional[int] = Query(None, ge=0, description="Número de página opcional que desea consultar específicamente")
):
    try:
        result = service.get_pages_from_bus_and_size(bus_bits, page_size_kb)
        return _build_response_dto(result, requested_page)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/size-from-bus",
    response_model=PaginationResponseDTO,
    summary="2. [Bus] + [Número Páginas] --> Calcular Anchura de Página",
    description="Calcula el tamaño de cada página a partir de los bits del bus y la cantidad total de páginas."
)
def get_size_from_bus_and_pages(
    bus_bits: int = Query(..., ge=1, le=128, description="Arquitectura del Bus en bits (ej: 16, 32, 64)"),
    total_pages: int = Query(..., ge=1, description="Cantidad total de páginas deseadas"),
    requested_page: Optional[int] = Query(None, ge=0, description="Número de página opcional que desea consultar específicamente")
):
    try:
        result = service.get_size_from_bus_and_pages(bus_bits, total_pages)
        return _build_response_dto(result, requested_page)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/bus-from-pages",
    response_model=PaginationResponseDTO,
    summary="3. [Número Páginas] + [Anchura Página] --> Calcular Arquitectura del Bus",
    description="Calcula los bits de bus mínimos requeridos a partir del número de páginas y el tamaño de página en KB."
)
def get_bus_from_pages_and_size(
    total_pages: int = Query(..., ge=1, description="Cantidad total de páginas deseadas"),
    page_size_kb: float = Query(..., gt=0, description="Tamaño o anchura de página en KB"),
    requested_page: Optional[int] = Query(None, ge=0, description="Número de página opcional que desea consultar específicamente")
):
    try:
        result = service.get_bus_from_pages_and_size(total_pages, page_size_kb)
        return _build_response_dto(result, requested_page)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))