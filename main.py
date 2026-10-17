from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from infrastructure.api.pagination_router import router as pagination_router

app = FastAPI(
    title="Simulador de Paginación de Memoria API",
    description="API RESTful para la simulación y cálculo de mapas de memoria y paginación bajo arquitectura DDD.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Redirigir la raíz (/) automáticamente a /docs
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

# Registrar el router de la API
app.include_router(pagination_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)