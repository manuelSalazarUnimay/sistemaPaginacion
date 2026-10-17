import os
from application.pagination_service import PaginationService
from domain.calculator import PaginationCalculator
from domain.exceptions import DomainException


class ConsoleInterface:
    def __init__(self):
        self.service = PaginationService()

    def clear_screen(self):
        os.system('cls' if os.name == 'nt' else 'clear')

    def display_memory_map(self, result):
        print("\n" + "=" * 50)
        print("      MAPA DE MEMORIA (DIRECCIONES INICIO - FIN)      ")
        print("=" * 50)

        for page in result.pages_sample:
            print(
                f"Página {page.page_number:04d} | Inicio: {page.start_address_hex.ljust(10)} -> Fin: {page.end_address_hex}")

        if result.total_pages > len(result.pages_sample):
            remaining = result.total_pages - len(result.pages_sample)
            print(f"\n... [{remaining:,} páginas adicionales no mostradas en la vista previa] ...")

    def run(self) -> bool:
        print("==================================================")
        print("   SIMULADOR EJECUTIVO DE PAGINACIÓN DE MEMORIA   ")
        print("==================================================")
        print("Seleccione la modalidad de cálculo:")
        print("1. [Bus] + [Anchura Página]  --> Calcular Número de Páginas")
        print("2. [Bus] + [Número Páginas]  --> Calcular Anchura de Página")
        print("3. [Número Páginas] + [Anchura Página] --> Calcular Arquitectura del Bus")
        print("4. Salir")

        opcion = input("\nIngrese la opción deseada (1, 2, 3 o 4): ").strip()
        print("-" * 50)

        try:
            if opcion == "1":
                bits_bus = int(input("► Ingrese Arquitectura del Bus (bits, ej: 16, 32, 64): "))
                tamano_kb = float(input("► Ingrese Anchura/Tamaño de Página en KB (ej: 4): "))

                res = self.service.get_pages_from_bus_and_size(bits_bus, tamano_kb)

                print("\n--- RESULTADO DE LA SIMULACIÓN ---")
                print(f"• Arquitectura del Bus:  {res.bus_bits} bits")
                print(
                    f"• Memoria Total:         {PaginationCalculator.bytes_to_legible(res.total_memory_bytes)} ({res.total_memory_bytes:,} bytes)")
                print(f"• Anchura de Página:     {tamano_kb} KB ({res.page_size_bytes:,} bytes)")
                print(f"• Total de Páginas:      {res.total_pages:,} páginas")
                self.display_memory_map(res)

            elif opcion == "2":
                bits_bus = int(input("► Ingrese Arquitectura del Bus (bits, ej: 16, 32, 64): "))
                num_paginas = int(input("► Ingrese Cantidad Total de Páginas que desearías (ej: 16): "))

                res = self.service.get_size_from_bus_and_pages(bits_bus, num_paginas)
                tamano_kb = res.page_size_bytes / 1024

                print("\n--- RESULTADO DE LA SIMULACIÓN (INVERSO) ---")
                print(f"• Arquitectura del Bus:  {res.bus_bits} bits")
                print(f"• Memoria Total:         {PaginationCalculator.bytes_to_legible(res.total_memory_bytes)}")
                print(f"• Cantidad de Páginas:   {res.total_pages:,}")
                print(f"• Anchura Calculada:     {tamano_kb:.2f} KB ({res.page_size_bytes:,} bytes)")
                self.display_memory_map(res)

            elif opcion == "3":
                num_paginas = int(input("► Ingrese Cantidad Total de Páginas: "))
                tamano_kb = float(input("► Ingrese Anchura/Tamaño de Página en KB: "))

                res = self.service.get_bus_from_pages_and_size(num_paginas, tamano_kb)

                print("\n--- RESULTADO DE LA SIMULACIÓN (INVERSO) ---")
                print(f"• Cantidad de Páginas:   {res.total_pages:,}")
                print(f"• Anchura de Página:     {tamano_kb} KB ({res.page_size_bytes:,} bytes)")
                print(f"• Memoria Requerida:     {PaginationCalculator.bytes_to_legible(res.total_memory_bytes)}")
                print(
                    f"• Bus Mínimo Necesario:  {res.bus_bits} bits (capacidad hasta {PaginationCalculator.bytes_to_legible(2 ** res.bus_bits)})")
                self.display_memory_map(res)

            elif opcion == "4":
                return False
            else:
                print("Opción no válida. Intente nuevamente.")

        except DomainException as e:
            print(f"\n[ERROR DE DOMINIO] {e}")
        except ValueError:
            print("\n[ERROR] Por favor, ingrese únicamente valores numéricos válidos.")

        return True