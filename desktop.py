import webview
import threading
import time
import uvicorn
from main import app  # Importa la instancia exacta que ya creaste en main.py

def iniciar_servidor_local():
    # Se ejecuta uvicorn pasándole la instancia 'app' directamente.
    # Es importante no usar reload=True en el ejecutable de escritorio.
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

if __name__ == '__main__':
    # 1. Iniciar el servidor web (FastAPI) en un hilo en segundo plano (daemon)
    hilo = threading.Thread(target=iniciar_servidor_local, daemon=True)
    hilo.start()

    # Pequeña pausa para asegurar que el servidor levantó antes de cargar la vista
    time.sleep(1.5)

    # 2. Iniciar PyWebView apuntando a la ruta del servidor local
    webview.create_window(
        title='Simulador de Paginación de Memoria',
        url='http://127.0.0.1:8000',
        width=1024,
        height=768,
        min_size=(800, 600)
    )

    # Iniciar la interfaz gráfica de escritorio
    webview.start()