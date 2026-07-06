from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.models.base import Base, CBSBase

# CRM / Support DB Engine
engine = create_async_engine(
    settings.sqlite_url,
    connect_args={"check_same_thread": False},
    echo=False,
)

# CBS DB Engine
cbs_engine = create_async_engine(
    settings.sqlite_cbs_url,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Use binds to route queries
AsyncSessionLocal = async_sessionmaker(
    binds={Base: engine, CBSBase: cbs_engine},
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    # This creates tables in both databases based on their metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with cbs_engine.begin() as conn:
        await conn.run_sync(CBSBase.metadata.create_all)
