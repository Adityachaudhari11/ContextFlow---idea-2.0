"""
run.py -- starts backend (venv Python) and frontend (pnpm) in separate windows.
Run from the contextflow/ directory:
    python run.py
"""
import subprocess
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(ROOT, "backend")
FRONTEND = os.path.join(ROOT, "frontend")
PYTHON = os.path.join(BACKEND, ".venv", "Scripts", "python.exe")


def open_terminal(title: str, bat_name: str, cwd: str, cmd: str):
    bat = os.path.join(ROOT, bat_name)
    with open(bat, "w") as f:
        f.write("@echo off\n")
        f.write(f'title {title}\n')
        f.write(f'cd /d "{cwd}"\n')
        f.write(f'{cmd}\n')
        f.write("pause\n")
    # Empty string before path = window title so spaces in path don't confuse start
    subprocess.Popen(f'start "" cmd /k "{bat}"', shell=True)


def main():
    print("Starting ContextFlow...")

    open_terminal(
        title="Backend :8000",
        bat_name="_run_backend.bat",
        cwd=BACKEND,
        cmd=f'"{PYTHON}" -m uvicorn app.main:app --reload --port 8000',
    )
    print("  Backend  -> http://127.0.0.1:8000")

    open_terminal(
        title="Frontend :5173",
        bat_name="_run_frontend.bat",
        cwd=FRONTEND,
        cmd="pnpm dev",
    )
    print("  Frontend -> http://localhost:5173")

    print("\nOpen http://localhost:5173 in your browser.")


if __name__ == "__main__":
    main()
