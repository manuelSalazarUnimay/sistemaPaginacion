import math
from domain.interfaces import ISegmentationAnalyzer, IPaginationCalculator
from domain.exceptions import InvalidInputException, PageOutOfBoundsException, ArchitectureOverflowException
from domain.models import MemoryPage, SegmentationInfo, PageRangeAnalysis, DidacticStep, PageSizeUnit


class SegmentationAnalyzer(ISegmentationAnalyzer):
    """Responsable de validar y analizar la física de segmentación de memoria."""

    ALLOWED_BUS_BITS = (16, 32, 64)

    @classmethod
    def resolve_unit(cls, unit: PageSizeUnit | str) -> PageSizeUnit:
        if isinstance(unit, PageSizeUnit):
            return unit
        if isinstance(unit, str):
            try:
                return PageSizeUnit(unit.upper())
            except ValueError:
                valid_units = ", ".join([u.value for u in PageSizeUnit])
                raise InvalidInputException(
                    f"Unidad de tamaño de página inválida ('{unit}'). Opciones válidas: {valid_units}"
                )
        raise InvalidInputException("La unidad debe ser de tipo PageSizeUnit o texto (str).")

    def analyze(
            self,
            bus_bits: int,
            page_size: float | None = None,
            unit: PageSizeUnit | str = PageSizeUnit.KB,
            *,
            page_size_kb: float | None = None
    ) -> SegmentationInfo:
        # Compatibilidad hacia atrás para llamadas posicionales o con el argumento legacy page_size_kb
        if page_size is None:
            if page_size_kb is not None:
                page_size = page_size_kb
                unit = PageSizeUnit.KB
            else:
                raise InvalidInputException("Debe especificar el tamaño de la página.")

        # 1. Validación de arquitectura de bus
        if bus_bits not in self.ALLOWED_BUS_BITS:
            valid_buses = ", ".join(map(str, self.ALLOWED_BUS_BITS))
            raise InvalidInputException(
                f"Arquitectura de bus no permitida ({bus_bits} bits). "
                f"Las arquitecturas soportadas son: {valid_buses} bits."
            )

        # 2. Resolución de unidad
        resolved_unit = self.resolve_unit(unit)

        # 3. Validación del valor recibido
        if not math.isfinite(page_size) or page_size <= 0:
            raise InvalidInputException(
                "El tamaño de página debe ser un número finito mayor a cero."
            )

        page_size_bytes = int(page_size * resolved_unit.bytes_multiplier)

        # 4. Verificación de potencia de 2
        if page_size_bytes < 1:
            raise InvalidInputException("El tamaño de página debe ser de al menos 1 byte.")

        offset_bits_float = math.log2(page_size_bytes)
        if not offset_bits_float.is_integer():
            raise InvalidInputException(
                f"El tamaño de página ({page_size} {resolved_unit.value} = {page_size_bytes} bytes) "
                f"debe ser una potencia exacta de 2."
            )

        offset_bits = int(offset_bits_float)
        vpn_bits = bus_bits - offset_bits

        if vpn_bits <= 0:
            raise InvalidInputException(
                f"El tamaño de página ({page_size} {resolved_unit.value} = 2^{offset_bits} bytes) "
                f"es igual o mayor al espacio de direccionamiento total (2^{bus_bits} bytes)."
            )

        total_memory_bytes = 2 ** bus_bits
        max_supported_pages = 2 ** vpn_bits

        return SegmentationInfo(
            bus_bits=bus_bits,
            page_size_val=page_size,
            page_size_unit=resolved_unit,
            page_size_bytes=page_size_bytes,
            offset_bits=offset_bits,
            vpn_bits=vpn_bits,
            max_supported_pages=max_supported_pages,
            total_memory_bytes=total_memory_bytes
        )


class DidacticStepBuilder:
    """Construcción de los pasos didácticos explicativos."""

    @staticmethod
    def build_steps(
            seg: SegmentationInfo,
            start_page: int,
            end_page: int,
            start_addr_dec: int,
            start_addr_hex: str,
            end_addr_dec: int,
            end_addr_hex: str
    ) -> list[DidacticStep]:
        return [
            DidacticStep(
                step_number=1,
                title="Segmentación de Datos y Registro de Dirección",
                explanation=(
                    f"Se analiza un bus de {seg.bus_bits} bits. "
                    f"El tamaño de página es {seg.page_size_val} {seg.page_size_unit.value} ({seg.page_size_bytes} bytes)."
                ),
                formula=(
                    f"Bits Offset = log2({seg.page_size_bytes}) = {seg.offset_bits} | "
                    f"Bits VPN = {seg.bus_bits} - {seg.offset_bits} = {seg.vpn_bits}"
                ),
                result_summary=f"Offset: {seg.offset_bits} bits | Número de Página (VPN): {seg.vpn_bits} bits"
            ),
            DidacticStep(
                step_number=2,
                title="Validación de Capacidad Máxima del Sistema",
                explanation=(
                    f"Con {seg.vpn_bits} bits dedicados a la página, el sistema soporta "
                    f"hasta {seg.max_supported_pages:,} páginas (índices 0 al {seg.max_supported_pages - 1})."
                ),
                formula=f"Páginas Máximas = 2^({seg.vpn_bits}) = {seg.max_supported_pages}",
                result_summary=f"Rango permitido: 0 a {seg.max_supported_pages - 1}"
            ),
            DidacticStep(
                step_number=3,
                title=f"Cálculo de Dirección de Inicio (Página {start_page})",
                explanation=f"La página {start_page} inicia en el primer byte de su bloque.",
                formula=f"Dir_Inicio = {start_page} * {seg.page_size_bytes}",
                result_summary=f"Decimal: {start_addr_dec:,} | Hex: {start_addr_hex}"
            ),
            DidacticStep(
                step_number=4,
                title=f"Cálculo de Dirección de Fin (Página {end_page})",
                explanation=f"El bloque termina en el último byte de la página {end_page}.",
                formula=f"Dir_Fin = (({end_page} + 1) * {seg.page_size_bytes}) - 1",
                result_summary=f"Decimal: {end_addr_dec:,} | Hex: {end_addr_hex}"
            )
        ]


class PaginationCalculator(IPaginationCalculator):
    """Motor principal de cálculo de paginación."""

    def __init__(self, segmentation_analyzer: ISegmentationAnalyzer | None = None):
        self._segmentation_analyzer = segmentation_analyzer or SegmentationAnalyzer()

    @staticmethod
    def bytes_to_legible(size_bytes: int) -> str:
        if size_bytes >= 1024 ** 3:
            return f"{size_bytes / (1024 ** 3):.2f} GB"
        if size_bytes >= 1024 ** 2:
            return f"{size_bytes / (1024 ** 2):.2f} MB"
        if size_bytes >= 1024:
            return f"{size_bytes / 1024:.2f} KB"
        return f"{size_bytes} Bytes"

    def calculate_specific_page(self, page_number: int, total_pages: int, page_size_bytes: int) -> MemoryPage:
        if page_number < 0 or page_number >= total_pages:
            raise PageOutOfBoundsException(
                f"La página {page_number} está fuera de rango. Debe estar entre 0 y {total_pages - 1}.",
                requested_page=page_number,
                total_pages=total_pages
            )

        start_address = page_number * page_size_bytes
        end_address = start_address + page_size_bytes - 1

        return MemoryPage(
            page_number=page_number,
            start_address=start_address,
            end_address=end_address
        )

    def calculate_range_didactic(
            self,
            bus_bits: int,
            page_size: float | None = None,
            start_page: int = 0,
            end_page: int = 0,
            unit: PageSizeUnit | str = PageSizeUnit.KB,
            *,
            page_size_kb: float | None = None
    ) -> PageRangeAnalysis:
        if start_page < 0 or end_page < start_page:
            raise InvalidInputException("El rango de páginas especificado es inválido.")

        seg = self._segmentation_analyzer.analyze(
            bus_bits=bus_bits,
            page_size=page_size,
            unit=unit,
            page_size_kb=page_size_kb
        )

        if end_page >= seg.max_supported_pages:
            page_bits_needed = end_page.bit_length()
            total_bits_needed = page_bits_needed + seg.offset_bits
            raise ArchitectureOverflowException(
                message=(
                    f"DESBORDAMIENTO: La página {end_page} excede el límite del bus. "
                    f"Se requieren {total_bits_needed} bits, pero solo hay {bus_bits}."
                ),
                required_bits=total_bits_needed,
                bus_bits=bus_bits,
                max_page=seg.max_supported_pages - 1,
                requested_page=end_page
            )

        hex_padding = math.ceil(seg.bus_bits / 4)
        start_addr_dec = start_page * seg.page_size_bytes

        start_addr_hex = f"0x{start_addr_dec:0{hex_padding}X}"
        end_addr_dec = (end_page + 1) * seg.page_size_bytes - 1
        end_addr_hex = f"0x{end_addr_dec:0{hex_padding}X}"

        steps = DidacticStepBuilder.build_steps(
            seg, start_page, end_page, start_addr_dec, start_addr_hex, end_addr_dec, end_addr_hex
        )

        pages_sample = self._generate_sample_pages(start_page, end_page, seg.max_supported_pages, seg.page_size_bytes)

        return PageRangeAnalysis(
            start_page=start_page,
            end_page=end_page,
            segmentation=seg,
            pages_sample=pages_sample,
            steps=steps
        )

    def _generate_sample_pages(
            self, start_page: int, end_page: int, total_pages: int, page_size_bytes: int, sample_limit: int = 16
    ) -> list[MemoryPage]:
        sample = []
        limit = min(end_page + 1, start_page + sample_limit)
        for i in range(start_page, limit):
            sample.append(self.calculate_specific_page(i, total_pages, page_size_bytes))
        if end_page >= limit:
            sample.append(self.calculate_specific_page(end_page, total_pages, page_size_bytes))
        return sample

    def calculate_by_bus_and_page_size(
            self,
            bus_bits: int,
            page_size: float | None = None,
            unit: PageSizeUnit | str = PageSizeUnit.KB,
            *,
            page_size_kb: float | None = None
    ) -> PageRangeAnalysis:
        seg = self._segmentation_analyzer.analyze(
            bus_bits=bus_bits,
            page_size=page_size,
            unit=unit,
            page_size_kb=page_size_kb
        )
        end_page = seg.max_supported_pages - 1
        pages_sample = self._generate_sample_pages(0, end_page, seg.max_supported_pages, seg.page_size_bytes)
        return PageRangeAnalysis(start_page=0, end_page=end_page, segmentation=seg, pages_sample=pages_sample)

    def calculate_by_bus_and_total_pages(self, bus_bits: int, total_pages: int) -> PageRangeAnalysis:
        if bus_bits not in SegmentationAnalyzer.ALLOWED_BUS_BITS:
            valid_buses = ", ".join(map(str, SegmentationAnalyzer.ALLOWED_BUS_BITS))
            raise InvalidInputException(
                f"Arquitectura de bus no permitida ({bus_bits} bits). "
                f"Las arquitecturas soportadas son: {valid_buses} bits."
            )
        if not isinstance(total_pages, int) or isinstance(total_pages, bool) or total_pages <= 0:
            raise InvalidInputException("El número total de páginas debe ser un entero mayor a cero.")
        if total_pages & (total_pages - 1):
            raise InvalidInputException(
                "El número total de páginas debe ser una potencia de 2 para obtener "
                "un tamaño de página compatible con el direccionamiento binario."
            )
        if total_pages > 2 ** bus_bits:
            raise InvalidInputException(
                "El número total de páginas no puede superar el espacio de direcciones."
            )

        total_memory = 2 ** bus_bits
        page_size_bytes = total_memory // total_pages

        seg = self._segmentation_analyzer.analyze(
            bus_bits=bus_bits,
            page_size=page_size_bytes,
            unit=PageSizeUnit.BYTES
        )
        pages_sample = self._generate_sample_pages(0, total_pages - 1, total_pages, page_size_bytes)
        return PageRangeAnalysis(start_page=0, end_page=total_pages - 1, segmentation=seg, pages_sample=pages_sample)

    def calculate_by_pages_and_page_size(
            self,
            total_pages: int,
            page_size: float | None = None,
            unit: PageSizeUnit | str = PageSizeUnit.KB,
            *,
            page_size_kb: float | None = None
    ) -> PageRangeAnalysis:
        if total_pages <= 0:
            raise InvalidInputException("El número total de páginas debe ser mayor a cero.")

        resolved_page_size = page_size if page_size is not None else page_size_kb
        if (
            resolved_page_size is None
            or not math.isfinite(resolved_page_size)
            or resolved_page_size <= 0
        ):
            raise InvalidInputException(
                "El tamaño de página debe ser un número finito mayor a cero."
            )

        resolved_unit = SegmentationAnalyzer.resolve_unit(unit)
        page_size_bytes = int(resolved_page_size * resolved_unit.bytes_multiplier)
        if page_size_bytes < 1:
            raise InvalidInputException("El tamaño de página debe ser de al menos 1 byte.")
        required_memory = total_pages * page_size_bytes

        bits_needed = math.ceil(math.log2(required_memory)) if required_memory > 0 else 1

        allowed_buses = sorted(SegmentationAnalyzer.ALLOWED_BUS_BITS)
        bus_bits = next((b for b in allowed_buses if b >= bits_needed), None)

        if bus_bits is None:
            max_bus = max(allowed_buses)
            raise ArchitectureOverflowException(
                message=f"La memoria requerida excede la arquitectura de bus máxima soportada ({max_bus} bits).",
                required_bits=bits_needed,
                bus_bits=max_bus,
                max_page=total_pages - 1,
                requested_page=total_pages - 1
            )

        seg = self._segmentation_analyzer.analyze(
            bus_bits=bus_bits,
            page_size=resolved_page_size,
            unit=resolved_unit
        )
        pages_sample = self._generate_sample_pages(0, total_pages - 1, seg.max_supported_pages, page_size_bytes)
        return PageRangeAnalysis(start_page=0, end_page=total_pages - 1, segmentation=seg, pages_sample=pages_sample)
