from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.api.pagination_router import router as pagination_controller


def create_app() -> FastAPI:
    app = FastAPI(
        title="Simulador de Paginación de Memoria API",
        description="API RESTful para la simulación de paginación bajo arquitectura DDD.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(pagination_controller)

    # Directorio infrastructure/web
    web_dir = Path(__file__).resolve().parent.parent / "web"

    # Archivos estáticos
    for folder in ("css", "js", "assets", "components"):
        folder_path = web_dir / folder

        if folder_path.is_dir():
            app.mount(
                f"/{folder}",
                StaticFiles(directory=str(folder_path)),
                name=folder,
            )

    @app.get("/", include_in_schema=False)
    def serve_ui():
        return FileResponse(str(web_dir / "index.html"))

    return app