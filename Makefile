BACKEND_DIR = backend
FRONTEND_DIR = frontend

.PHONY: install migrate seed backend frontend dev

install:
	cd $(BACKEND_DIR) && python -m uv pip install -e . --python .venv/Scripts/python.exe
	cd $(FRONTEND_DIR) && pnpm install

migrate:
	cd $(BACKEND_DIR) && .venv/Scripts/python.exe -m alembic upgrade head

seed:
	cd $(BACKEND_DIR) && .venv/Scripts/python.exe -m app.scripts.seed_db

backend:
	cd $(BACKEND_DIR) && .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

frontend:
	cd $(FRONTEND_DIR) && pnpm dev

dev:
	@echo "Start backend: cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000"
	@echo "Start frontend: cd frontend && pnpm dev"
