import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Actúa como tu @RestController
from infrastructure.api.pagination_router import router as pagination_controller


def create_app() -> FastAPI:
    """Patrón Factory para ensamblar la aplicación."""

    # 1. Inicializar FastAPI (Swagger se auto-configura aquí y vivirá en /docs)
    app = FastAPI(
        title="Simulador de Paginación de Memoria API",
        description="API RESTful para la simulación de paginación bajo arquitectura DDD.",
        version="1.0.0",
        docs_url="/docs",  # Ruta del Swagger auto-generado
        redoc_url="/redoc"
    )

    # 2. Habilitar CORS (Equivalente a @CrossOrigin)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. Registrar Controladores (Inyectar el APIRouter)
    # Todos los endpoints de este controlador tienen el prefijo /api/v1/pagination
    app.include_router(pagination_controller)

    # 4. Configurar rutas para la carpeta 'web' (Frontend)
    base_dir = os.path.dirname(os.path.dirname(__file__))
    web_dir = os.path.join(base_dir, "web")

    # Montar las subcarpetas estáticas para que el index.html pueda leer el CSS y JS
    app.mount("/css", StaticFiles(directory=os.path.join(web_dir, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(web_dir, "js")), name="js")
    app.mount("/assets", StaticFiles(directory=os.path.join(web_dir, "assets")), name="assets")
    app.mount("/components", StaticFiles(directory=os.path.join(web_dir, "components")), name="components")

    # 5. Servir el Frontend en la raíz
    @app.get("/", include_in_schema=False)
    def serve_ui():
        """Sirve el archivo index.html cuando se entra a la raíz del sitio."""
        return FileResponse(os.path.join(web_dir, "index.html"))

    return app