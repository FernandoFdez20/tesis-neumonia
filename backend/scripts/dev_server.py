"""Servidor de desarrollo con recarga automática real en Windows.

Por qué existe esto en vez de usar `uvicorn --reload`:

En Windows, uvicorn reinicia el proceso hijo con
`os.kill(pid, signal.CTRL_C_EVENT)` (ver uvicorn/supervisors/basereload.py).
Ese evento necesita que padre e hijo compartan una CONSOLA. Si el proceso
se lanzó sin consola interactiva (servicio, CI, terminal de un agente), el
evento nunca llega: el log dice "Reloading..." pero el hijo viejo sigue
atendiendo y el código nuevo no llega a cargarse nunca.

Este script evita ese mecanismo por completo: mira los archivos con
`watchfiles` y él mismo termina y vuelve a lanzar uvicorn.

Uso (desde backend/):
    .\\venv\\Scripts\\python.exe scripts\\dev_server.py
"""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from watchfiles import watch

BASE = Path(__file__).resolve().parents[1]
APP_DIR = BASE / "app"
HOST = "127.0.0.1"
PORT = 8000

# __pycache__ y los .pyc generan eventos sin que cambie el código.
RUIDO = {"__pycache__", ".pytest_cache", ".mypy_cache"}

proceso = None


def puerto_libre() -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex((HOST, PORT)) != 0


def detener(proc) -> None:
    """Termina el proceso y todo su árbol (en Windows /T evita hijos vivos)."""
    if proc is None or proc.poll() is not None:
        return
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                capture_output=True,
                check=False,
            )
        else:
            proc.terminate()
        proc.wait(timeout=10)
    except Exception:
        pass


def arrancar():
    global proceso
    comando = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", HOST, "--port", str(PORT),
    ]
    print(f"[dev] arrancando uvicorn en http://{HOST}:{PORT}", flush=True)
    proceso = subprocess.Popen(comando, cwd=str(BASE))


def reiniciar():
    global proceso
    detener(proceso)
    # Espera activa a que el puerto quede libre antes de volver a bindear,
    # que es la causa clásica del error 10048 en Windows.
    for _ in range(40):
        if puerto_libre():
            break
        time.sleep(0.25)
    arrancar()


def cambios_relevantes(cambios) -> list[str]:
    """Filtra .py del backend e ignora el ruido de compilación."""
    relevantes = []
    for _, ruta in cambios:
        partes = set(Path(ruta).parts)
        if partes & RUIDO:
            continue
        if Path(ruta).suffix != ".py":
            continue
        try:
            relevantes.append(str(Path(ruta).relative_to(BASE)))
        except ValueError:
            relevantes.append(ruta)
    return relevantes


def main() -> None:
    global proceso
    print(f"[dev] vigilando cambios en: {APP_DIR}", flush=True)
    arrancar()

    while True:
        for cambios in watch(str(APP_DIR)):
            relevantes = cambios_relevantes(cambios)
            if not relevantes:
                continue
            print(f"[dev] {len(relevantes)} archivo(s) cambiados: "
                  f"{', '.join(relevantes)}", flush=True)
            print("[dev] reiniciando...", flush=True)
            reiniciar()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[dev] detenido.", flush=True)
    finally:
        detener(proceso)