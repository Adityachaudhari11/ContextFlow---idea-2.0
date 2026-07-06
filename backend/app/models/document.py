from sqlalchemy import String, Enum as SAEnum, Boolean, ForeignKey, Integer
from sqlalchemy.orm import mapped_column, Mapped, relationship
from .base import Base, TimestampMixin, new_uuid
import enum


class FileType(str, enum.Enum):
    pdf = "pdf"
    csv = "csv"


class UploadedDocument(Base, TimestampMixin):
    __tablename__ = "uploaded_documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    # References CBS customers table without a strict SQL ForeignKey
    customer_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[FileType] = mapped_column(SAEnum(FileType), nullable=False)
    uploaded_by: Mapped[str] = mapped_column(String, ForeignKey("agents.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
