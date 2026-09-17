import logging
from typing import Optional
from app.core.config import settings

try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
except ImportError:
    AsyncIOMotorClient = None
    AsyncIOMotorDatabase = None

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models as qdrant_models
except ImportError:
    QdrantClient = None
    qdrant_models = None

logger = logging.getLogger("hubzy.database")

class DatabaseManager:
    def __init__(self):
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.qdrant_client: Optional[QdrantClient] = None
        self.qdrant_collection: str = "hubzy_study_embeddings"

    async def connect(self):
        """Inicializa conexiones asíncronas con MongoDB y cliente Qdrant Vector DB."""
        try:
            if AsyncIOMotorClient is None:
                logger.info("Motor no instalado en el entorno actual. Modo local sin MongoDB activado.")
                self.db = None
            else:
                logger.info(f"Conectando a MongoDB en: {settings.MONGODB_URI}...")
                self.mongo_client = AsyncIOMotorClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=5000
                )
                self.db = self.mongo_client[settings.MONGODB_DB_NAME]
                # Validar conexión
                await self.mongo_client.admin.command('ping')
                logger.info(f"Conectado exitosamente a MongoDB (BD: {settings.MONGODB_DB_NAME})")
        except Exception as e:
            logger.error(f"Error conectando a MongoDB: {e}")
            self.db = None

        try:
            if QdrantClient is not None and settings.QDRANT_URL and settings.QDRANT_API_KEY:
                logger.info("Conectando a Qdrant Cloud Vector DB...")
                self.qdrant_client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY,
                    timeout=10
                )
                collections = [c.name for c in self.qdrant_client.get_collections().collections]
                if self.qdrant_collection not in collections:
                    self.qdrant_client.create_collection(
                        collection_name=self.qdrant_collection,
                        vectors_config=qdrant_models.VectorParams(
                            size=768,
                            distance=qdrant_models.Distance.COSINE
                        )
                    )
                logger.info(f"Conectado exitosamente a Qdrant (Colección: {self.qdrant_collection})")
            else:
                logger.info("Qdrant no configurado con credenciales en .env")
        except Exception as e:
            logger.error(f"Error conectando a Qdrant: {e}")
            self.qdrant_client = None

    async def close(self):
        """Cierra conexiones activas."""
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("Conexión MongoDB cerrada limpiamente.")

db_manager = DatabaseManager()

