import sys
from application.pagination_service import PaginationService
from domain.exceptions import DomainException


class PaginationCLI:
    """Console interface (CLI) for the Memory Pagination Simulator."""

    def __init__(self, service: PaginationService | None = None):
        self.service = service or PaginationService()

    def run(self) -> None:
        print("=" * 60)
        print("    SIMULADOR DE PAGINACIÓN DE MEMORIA (DDD Architecture)")
        print("=" * 60)

        while True:
            print("\nSeleccione una opción:")
            print("1. Calcular páginas desde Bus y Tamaño de Página")
            print("2. Calcular tamaño de página desde Bus y Total de Páginas")
            print("3. Calcular Bus desde Total de Páginas y Tamaño")
            print("4. Análisis Didáctico Paso a Paso (Rango de Páginas)")
            print("5. Salir")

            option = input("\nOpción > ").strip()

            if option == "1":
                self._handle_pages_from_bus()
            elif option == "2":
                self._handle_size_from_bus()
            elif option == "3":
                self._handle_bus_from_pages()
            elif option == "4":
                self._handle_didactic_range()
            elif option == "5":
                print("¡Hasta luego!")
                sys.exit(0)
            else:
                print("Opción no válida. Intente de nuevo.")

    def _handle_pages_from_bus(self) -> None:
        try:
            bus_bits = int(input("Ingrese los bits del bus (ej: 16, 32, 64): "))
            page_size_kb = float(input("Ingrese el tamaño de página en KB (ej: 4.0): "))
            result = self.service.get_pages_from_bus_and_size(bus_bits, page_size_kb)
            print(f"\n[ÉXITO] Páginas totales soportadas: {result.end_page + 1:,}")
            print(f"Bits Offset: {result.segmentation.offset_bits} | Bits VPN: {result.segmentation.vpn_bits}")
        except DomainException as e:
            print(f"\n[ERROR DE DOMINIO] {e}")
        except ValueError:
            print("\n[ERROR] Entrada de datos no válida.")

    def _handle_size_from_bus(self) -> None:
        try:
            bus_bits = int(input("Ingrese los bits del bus: "))
            total_pages = int(input("Ingrese la cantidad total de páginas: "))
            result = self.service.get_size_from_bus_and_pages(bus_bits, total_pages)
            print(f"\n[ÉXITO] Tamaño de página calculado: {result.segmentation.page_size_kb:.2f} KB ({result.segmentation.page_size_bytes} bytes)")
        except DomainException as e:
            print(f"\n[ERROR DE DOMINIO] {e}")
        except ValueError:
            print("\n[ERROR] Entrada de datos no válida.")

    def _handle_bus_from_pages(self) -> None:
        try:
            total_pages = int(input("Ingrese la cantidad total de páginas: "))
            page_size_kb = float(input("Ingrese el tamaño de página en KB: "))
            result = self.service.get_bus_from_pages_and_size(total_pages, page_size_kb)
            print(f"\n[ÉXITO] Bus mínimo requerido: {result.segmentation.bus_bits} bits")
        except DomainException as e:
            print(f"\n[ERROR DE DOMINIO] {e}")
        except ValueError:
            print("\n[ERROR] Entrada de datos no válida.")

    def _handle_didactic_range(self) -> None:
        try:
            bus_bits = int(input("Ingrese los bits del bus (ej: 16): "))
            page_size_kb = float(input("Ingrese el tamaño de página en KB (ej: 4.0): "))
            start_page = int(input("Página inicial (ej: 0): "))
            end_page = int(input("Página final (ej: 5): "))

            result = self.service.get_didactic_page_range(bus_bits, page_size_kb, start_page, end_page)

            print("\n" + "=" * 50)
            print("          ANÁLISIS DIDÁCTICO PASO A PASO")
            print("=" * 50)
            for step in result.steps:
                print(f"\nPaso {step.step_number}: {step.title}")
                print(f"  Explicación: {step.explanation}")
                print(f"  Fórmula:     {step.formula}")
                print(f"  Resultado:   {step.result_summary}")

            print("\n" + "-" * 50)
            print(f"Rango Hexadecimal del Bloque: {result.start_address_hex} -> {result.end_address_hex}")
            print("-" * 50)

        except DomainException as e:
            print(f"\n[ERROR DE DOMINIO] {e}")
        except ValueError:
            print("\n[ERROR] Entrada de datos no válida.")


if __name__ == "__main__":
    cli = PaginationCLI()
    cli.run()