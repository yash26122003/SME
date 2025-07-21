from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis_client import redis_client
from app.middleware.auth import get_current_user
from app.middleware.logging import LoggingMiddleware
from app.routes import data_sources, etl_pipelines, data_quality, batch_jobs
from app.utils.logger import logger

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Data Processing Service")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis connection
    await redis_client.ping()
    logger.info("Redis connection established")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Data Processing Service")
    await redis_client.close()

app = FastAPI(
    title="SMEBI Data Processing Service",
    description="Data ingestion, ETL pipelines, and batch processing service",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(LoggingMiddleware)

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        await redis_client.ping()
        return {
            "status": "healthy",
            "service": "data-processing",
            "database": "connected",
            "redis": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "data-processing",
                "error": str(e)
            }
        )

# Routes
app.include_router(
    data_sources.router,
    prefix="/data/sources",
    tags=["Data Sources"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    etl_pipelines.router,
    prefix="/data/pipelines",
    tags=["ETL Pipelines"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    data_quality.router,
    prefix="/data/quality",
    tags=["Data Quality"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    batch_jobs.router,
    prefix="/data/jobs",
    tags=["Batch Jobs"],
    dependencies=[Depends(get_current_user)]
)

# Data upload endpoint
@app.post("/data/upload")
async def upload_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload data file for processing"""
    try:
        # Validate file type
        allowed_types = ['text/csv', 'application/json', 'application/vnd.ms-excel']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload CSV, JSON, or Excel files."
            )
        
        # Save file
        file_path = f"uploads/{current_user['organization_id']}/{file.filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Add background task for processing
        background_tasks.add_task(
            process_uploaded_file,
            file_path,
            current_user['organization_id'],
            current_user['user_id']
        )
        
        logger.info(f"File uploaded: {file.filename} by user {current_user['user_id']}")
        
        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "size": len(content),
            "processing": True
        }
        
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")

async def process_uploaded_file(file_path: str, organization_id: str, user_id: str):
    """Background task to process uploaded file"""
    try:
        # Implementation for file processing
        logger.info(f"Processing file: {file_path}")
        
        # Add your file processing logic here
        # - Parse the file based on type
        # - Validate data
        # - Store in database
        # - Update processing status
        
        await redis_client.set(f"file_processing:{file_path}", "completed")
        
    except Exception as e:
        logger.error(f"File processing failed: {str(e)}")
        await redis_client.set(f"file_processing:{file_path}", "failed")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3003)),
        reload=settings.DEBUG
    )
