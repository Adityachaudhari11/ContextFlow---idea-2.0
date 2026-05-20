from fastapi import WebSocket
from collections import defaultdict
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # agent_id → list of WebSocket connections (multiple tabs)
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, agent_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[agent_id].append(ws)
        logger.info(f"Agent {agent_id} connected. Total connections: {self._total()}")

    def disconnect(self, agent_id: str, ws: WebSocket) -> None:
        self._connections[agent_id].discard if hasattr(self._connections[agent_id], 'discard') else None
        try:
            self._connections[agent_id].remove(ws)
        except ValueError:
            pass
        logger.info(f"Agent {agent_id} disconnected. Total connections: {self._total()}")

    async def send_to_agent(self, agent_id: str, data: dict) -> None:
        dead = []
        for ws in self._connections.get(agent_id, []):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            try:
                self._connections[agent_id].remove(ws)
            except ValueError:
                pass

    async def broadcast(self, data: dict) -> None:
        for agent_id in list(self._connections.keys()):
            await self.send_to_agent(agent_id, data)

    def _total(self) -> int:
        return sum(len(v) for v in self._connections.values())


ws_manager = ConnectionManager()
