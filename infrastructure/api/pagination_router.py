from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status

from application.pagination_service import PaginationService
from domain.calculator import PaginationCalculator
from domain.exceptions import DomainException
from domain.models import PageRangeAnalysis, PageSizeUnit
from infrastructure.api.dtos import (
    PaginationResponseDTO,
    MemoryPageDTO,
    SegmentationInfoDTO,
    PageRangeResponseDTO,
    DidacticStepDTO
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pagination", tags=["Simulador de Paginación"])
service = PaginationService()


def _map_segmentation(seg) -> SegmentationInfoDTO:
    return SegmentationInfoDTO(
        bus_bits=seg.bus_bits,
        page_size_val=seg.page_size_val,
        page_size_unit=seg.page_size_unit.value,
        page_size_bytes=seg.page_size_bytes,
        page_size_kb=seg.page_size_kb,  # Propiedad calculada explícita
        offset_bits=seg.offset_bits,
        vpn_bits=seg.vpn_bits,
        max_supported_pages=seg.max_supported_pages,
        total_memory_bytes=seg.total_memory_bytes
    )


def _build_response_dto(result: PageRangeAnalysis, requested_page: Optional[int] = None) -> PaginationResponseDTO:
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
        page_detail = service.get_page_detail(result, requested_page)
        requested_page_dto = MemoryPageDTO(
            page_number=page_detail.page_number,
            start_address=page_detail.start_address,
            end_address=page_detail.end_address,
            start_address_hex=page_detail.start_address_hex,
            end_address_hex=page_detail.end_address_hex
        )

    seg = result.segmentation

    return PaginationResponseDTO(
        bus_bits=seg.bus_bits,
        total_pages=result.end_page + 1,
        page_size_bytes=seg.page_size_bytes,
        page_size_kb=seg.page_size_kb,
        total_memory_bytes=seg.total_memory_bytes,
        total_memory_legible=PaginationCalculator.bytes_to_legible(seg.total_memory_bytes),
        pages_sample=pages_sample_dto,
        requested_page_detail=requested_page_dto,
        segmentation=_map_segmentation(seg)
    )


@router.get(
    "/pages-from-bus",
    response_model=PaginationResponseDTO,
    summary="1. [Bus] + [Anchura Página] --> Calcular Número de Páginas"
)
def get_pages_from_bus_and_size(
    bus_bits: int = Query(..., ge=1, le=128, description="Arquitectura del Bus en bits (ej: 16, 32, 64)"),
    page_size: float = Query(..., gt=0, description="Valor del tamaño de página (ej: 4.0)"),
    unit: PageSizeUnit = Query(PageSizeUnit.KB, description="Unidad de medida (B, KB, MB, GB)"),
    requested_page: Optional[int] = Query(None, ge=0, description="Número de página específico")
):
    try:
        result = service.get_pages_from_bus_and_size(bus_bits=bus_bits, page_size=page_size, unit=unit)
        return _build_response_dto(result, requested_page)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/size-from-bus",
    response_model=PaginationResponseDTO,
    summary="2. [Bus] + [Número Páginas] --> Calcular Anchura de Página"
)
def get_size_from_bus_and_pages(
    bus_bits: int = Query(..., ge=1, le=128, description="Arquitectura del Bus en bits (ej: 16, 32, 64)"),
    total_pages: int = Query(..., ge=1, description="Cantidad total de páginas deseadas"),
    requested_page: Optional[int] = Query(None, ge=0, description="Número de página específico")
):
    try:
        result = service.get_size_from_bus_and_pages(bus_bits, total_pages)
        return _build_response_dto(result, requested_page)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/bus-from-pages",
    response_model=PaginationResponseDTO,
    summary="3. [Número Páginas] + [Anchura Página] --> Calcular Arquitectura del Bus"
)
def get_bus_from_pages_and_size(
    total_pages: int = Query(..., ge=1, description="Cantidad total de páginas deseadas"),
    page_size: float = Query(..., gt=0, description="Valor del tamaño de página (ej: 4.0)"),
    unit: PageSizeUnit = Query(PageSizeUnit.KB, description="Unidad de medida (B, KB, MB, GB)"),
    requested_page: Optional[int] = Query(None, ge=0, description="Número de página específico")
):
    try:
        result = service.get_bus_from_pages_and_size(total_pages=total_pages, page_size=page_size, unit=unit)
        return _build_response_dto(result, requested_page)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/range-didactic",
    response_model=PageRangeResponseDTO,
    summary="4. Análisis Didáctico de Rango de Páginas"
)
def get_didactic_page_range(
    bus_bits: int = Query(..., ge=1, le=128, description="Arquitectura del Bus en bits (ej: 16)"),
    page_size: float = Query(..., gt=0, description="Valor del tamaño de página (ej: 4.0)"),
    unit: PageSizeUnit = Query(PageSizeUnit.KB, description="Unidad de medida (B, KB, MB, GB)"),
    start_page: int = Query(..., ge=0, description="Página inicial del rango (ej: 0)"),
    end_page: int = Query(..., ge=0, description="Página final del rango (ej: 10)")
):
    try:
        result = service.get_didactic_page_range(
            bus_bits=bus_bits, page_size=page_size, start_page=start_page, end_page=end_page, unit=unit
        )
        return PageRangeResponseDTO(
            start_page=result.start_page,
            end_page=result.end_page,
            total_pages_in_block=result.total_pages_in_block,
            start_address_dec=result.start_address_dec,
            end_address_dec=result.end_address_dec,
            start_address_hex=result.start_address_hex,
            end_address_hex=result.end_address_hex,
            segmentation=_map_segmentation(result.segmentation),
            pages_sample=[
                MemoryPageDTO(
                    page_number=p.page_number,
                    start_address=p.start_address,
                    end_address=p.end_address,
                    start_address_hex=p.start_address_hex,
                    end_address_hex=p.end_address_hex,
                )
                for p in result.pages_sample
            ],
            steps=[DidacticStepDTO(**s.__dict__) for s in result.steps]
        )
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Error inesperado en /range-didactic")
        raise