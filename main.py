from infrastructure.cli import ConsoleInterface

def main():
    cli = ConsoleInterface()
    continuar = True
    while continuar:
        cli.clear_screen()
        continuar = cli.run()
        if continuar:
            input("\nPresione ENTER para continuar...")

if __name__ == "__main__":
    main()