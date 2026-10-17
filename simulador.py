import math
import os


def limpiar_pantalla():
    """Limpia la consola dependiendo del sistema operativo."""
    os.system('cls' if os.name == 'nt' else 'clear')


def bytes_a_legible(tamano_bytes):
    """Convierte bytes a formato humano (KB, MB, GB)."""
    if tamano_bytes >= 1024 ** 3:
        return f"{tamano_bytes / (1024 ** 3):.2f} GB"
    elif tamano_bytes >= 1024 ** 2:
        return f"{tamano_bytes / (1024 ** 2):.2f} MB"
    elif tamano_bytes >= 1024:
        return f"{tamano_bytes / 1024:.2f} KB"
    return f"{tamano_bytes} Bytes"


def imprimir_tabla_paginas(total_paginas, tamano_pagina_bytes):
    """Genera el mapa de memoria con rango de direcciones Hexadecimales."""
    print("\n" + "=" * 50)
    print("      MAPA DE MEMORIA (DIRECCIONES INICIO - FIN)      ")
    print("=" * 50)

    # Límite de muestras para no saturar la consola
    limite = min(total_paginas, 16)

    for i in range(limite):
        dir_inicio = i * tamano_pagina_bytes
        dir_fin = dir_inicio + tamano_pagina_bytes - 1
        print(f"Página {i:04d} | Inicio: {hex(dir_inicio).upper().ljust(10)} -> Fin: {hex(dir_fin).upper()}")

    if total_paginas > limite:
        print(f"\n... [{total_paginas - limite:,} páginas adicionales no mostradas en la vista previa] ...")


def simulador_paginacion():
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
        # --------------------------------------------------
        # MODO 1: CALCULAR NÚMERO DE PÁGINAS (DIRECTO)
        # --------------------------------------------------
        if opcion == "1":
            bits_bus = int(input("► Ingrese Arquitectura del Bus (bits, ej: 16, 32, 64): "))
            tamano_kb = float(input("► Ingrese Anchura/Tamaño de Página en KB (ej: 4): "))

            memoria_total = 2 ** bits_bus
            tamano_bytes = int(tamano_kb * 1024)
            num_paginas = memoria_total // tamano_bytes

            print("\n--- RESULTADO DE LA SIMULACIÓN ---")
            print(f"• Arquitectura del Bus:  {bits_bus} bits")
            print(f"• Memoria Total:         {bytes_a_legible(memoria_total)} ({memoria_total:,} bytes)")
            print(f"• Anchura de Página:     {tamano_kb} KB ({tamano_bytes:,} bytes)")
            print(f"• Total de Páginas:      {num_paginas:,} páginas")

            imprimir_tabla_paginas(num_paginas, tamano_bytes)

        # --------------------------------------------------
        # MODO 2: CALCULAR ANCHURA DE PÁGINA (INVERSO A)
        # --------------------------------------------------
        elif opcion == "2":
            bits_bus = int(input("► Ingrese Arquitectura del Bus (bits, ej: 16, 32, 64): "))
            num_paginas = int(input("► Ingrese Cantidad Total de Páginas que desearías (ej: 16): "))

            memoria_total = 2 ** bits_bus
            tamano_bytes = memoria_total // num_paginas
            tamano_kb = tamano_bytes / 1024

            print("\n--- RESULTADO DE LA SIMULACIÓN (INVERSO) ---")
            print(f"• Arquitectura del Bus:  {bits_bus} bits")
            print(f"• Memoria Total:         {bytes_a_legible(memoria_total)}")
            print(f"• Cantidad de Páginas:   {num_paginas:,}")
            print(f"• Anchura Calculada:     {tamano_kb:.2f} KB ({tamano_bytes:,} bytes)")

            imprimir_tabla_paginas(num_paginas, tamano_bytes)

        # --------------------------------------------------
        # MODO 3: CALCULAR ARQUITECTURA DEL BUS (INVERSO B)
        # --------------------------------------------------
        elif opcion == "3":
            num_paginas = int(input("► Ingrese Cantidad Total de Páginas: "))
            tamano_kb = float(input("► Ingrese Anchura/Tamaño de Página en KB: "))

            tamano_bytes = int(tamano_kb * 1024)
            memoria_requerida = num_paginas * tamano_bytes
            bits_bus_necesarios = math.ceil(math.log2(memoria_requerida))

            print("\n--- RESULTADO DE LA SIMULACIÓN (INVERSO) ---")
            print(f"• Cantidad de Páginas:   {num_paginas:,}")
            print(f"• Anchura de Página:     {tamano_kb} KB ({tamano_bytes:,} bytes)")
            print(f"• Memoria Requerida:     {bytes_a_legible(memoria_requerida)}")
            print(
                f"• Bus Mínimo Necesario:  {bits_bus_necesarios} bits (capacidad hasta {bytes_a_legible(2 ** bits_bus_necesarios)})")

            imprimir_tabla_paginas(num_paginas, tamano_bytes)

        elif opcion == "4":
            return False

        else:
            print("Opción no válida. Intente nuevamente.")

    except ValueError:
        print("\n[ERROR] Por favor, ingrese únicamente valores numéricos válidos.")

    return True


def main():
    continuar = True
    while continuar:
        limpiar_pantalla()
        continuar = simulador_paginacion()
        if continuar:
            input("\nPresione ENTER para continuar...")


if __name__ == "__main__":
    main()