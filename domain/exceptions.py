class DomainException(Exception):
    """Excepción base para la capa de dominio."""
    pass

class InvalidInputException(DomainException):
    """Se lanza cuando los datos de entrada son inválidos."""
    pass