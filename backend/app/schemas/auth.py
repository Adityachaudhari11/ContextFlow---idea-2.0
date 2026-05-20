from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    agent_id: str
    full_name: str
    role: str


class AgentMe(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
