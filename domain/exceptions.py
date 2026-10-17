class DomainException(Exception):
    """Excepción base para la capa de dominio."""
    pass

class InvalidInputException(DomainException):
    """Se lanza cuando los datos de entrada son inválidos."""
    pass

class PageOutOfBoundsException(DomainException):
    """Lanzada cuando se solicita un número de página fuera del rango [0, total_pages - 1]."""
    pass