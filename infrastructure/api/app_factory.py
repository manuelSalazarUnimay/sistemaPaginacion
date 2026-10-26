import os
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.api.pagination_router import router as pagination_controller


def create_app() -> FastAPI:
    """Patrón Factory para ensamblar la aplicación."""

    app = FastAPI(
        title="Simulador de Paginación de Memoria API",
        description="API RESTful para la simulación de paginación bajo arquitectura DDD.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(pagination_controller)

    # 1. Obtener la raíz del proyecto desde la ubicación de este archivo (infrastructure/api/ -> raíz)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    web_dir = os.path.join(project_root, "web")

    # 2. Montar carpetas estáticas SOLO si existen en el despliegue
    for folder in ["css", "js", "assets", "components"]:
        folder_path = os.path.join(web_dir, folder)
        if os.path.exists(folder_path):
            app.mount(f"/{folder}", StaticFiles(directory=folder_path), name=folder)

    # 3. Servir Frontend con validación de existencia
    @app.get("/", include_in_schema=False)
    def serve_ui():
        index_path = os.path.join(web_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse({"message": "API activa. Visita /docs para ver la documentación."})

    return app
