import uvicorn
from infrastructure.api.app_factory import create_app

# Instanciamos la aplicación delegando toda la construcción al Factory
app = create_app()

if __name__ == "__main__":
    print("==================================================")
    print("🚀 Servidor iniciado exitosamente.")
    print("💻 Aplicación Web: http://127.0.0.1:8000/")
    print("⚙️  Swagger UI:    http://127.0.0.1:8000/docs")
    print("==================================================")

    # uvicorn recibe "main:app" como string para permitir el recargado automático (reload=True)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)