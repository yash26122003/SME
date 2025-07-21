from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
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
from app.routes import nlp, predictions, model_training, model_monitoring
from app.services.gemini_service import GeminiService
from app.services.tensorflow_service import TensorFlowService
from app.utils.logger import logger

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI/ML Service")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis connection
    await redis_client.ping()
    logger.info("Redis connection established")
    
    # Initialize AI services
    app.state.gemini_service = GeminiService()
    app.state.tensorflow_service = TensorFlowService()
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI/ML Service")
    await redis_client.close()

app = FastAPI(
    title="SMEBI AI/ML Service",
    description="Natural Language Processing and Machine Learning service with Gemini 2.0 Flash and TensorFlow.js",
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
        
        # Check AI services
        gemini_status = await app.state.gemini_service.health_check()
        tensorflow_status = app.state.tensorflow_service.health_check()
        
        return {
            "status": "healthy",
            "service": "ai-ml",
            "database": "connected",
            "redis": "connected",
            "gemini": gemini_status,
            "tensorflow": tensorflow_status
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "ai-ml",
                "error": str(e)
            }
        )

# Routes
app.include_router(
    nlp.router,
    prefix="/ai/nlp",
    tags=["Natural Language Processing"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    predictions.router,
    prefix="/ai/predictions",
    tags=["Predictions"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    model_training.router,
    prefix="/ai/training",
    tags=["Model Training"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    model_monitoring.router,
    prefix="/ai/monitoring",
    tags=["Model Monitoring"],
    dependencies=[Depends(get_current_user)]
)

# Natural language query endpoint
@app.post("/ai/query")
async def process_natural_language_query(
    query_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Process natural language business intelligence queries"""
    try:
        query = query_data.get("query")
        context = query_data.get("context", {})
        
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")
        
        # Use Gemini for natural language understanding
        gemini_response = await app.state.gemini_service.process_business_query(
            query=query,
            context=context,
            organization_id=current_user['organization_id']
        )
        
        logger.info(f"NL query processed for user {current_user['user_id']}: {query}")
        
        return {
            "query": query,
            "interpretation": gemini_response["interpretation"],
            "sql_query": gemini_response.get("sql_query"),
            "visualization_config": gemini_response.get("visualization_config"),
            "insights": gemini_response.get("insights", []),
            "confidence": gemini_response.get("confidence", 0.0)
        }
        
    except Exception as e:
        logger.error(f"NL query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Query processing failed")

# Predictive analytics endpoint
@app.post("/ai/predict")
async def generate_predictions(
    prediction_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Generate predictive analytics using TensorFlow models"""
    try:
        model_type = prediction_data.get("model_type")
        data = prediction_data.get("data")
        features = prediction_data.get("features", [])
        
        if not model_type or not data:
            raise HTTPException(
                status_code=400,
                detail="Model type and data are required"
            )
        
        # Generate predictions using TensorFlow
        predictions = await app.state.tensorflow_service.predict(
            model_type=model_type,
            data=data,
            features=features,
            organization_id=current_user['organization_id']
        )
        
        # Store prediction results
        background_tasks.add_task(
            store_prediction_results,
            predictions,
            current_user['user_id'],
            current_user['organization_id']
        )
        
        logger.info(f"Predictions generated for user {current_user['user_id']}")
        
        return {
            "model_type": model_type,
            "predictions": predictions["results"],
            "confidence": predictions.get("confidence", 0.0),
            "model_version": predictions.get("model_version"),
            "execution_time": predictions.get("execution_time")
        }
        
    except Exception as e:
        logger.error(f"Prediction generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction generation failed")

async def store_prediction_results(predictions, user_id: str, organization_id: str):
    """Background task to store prediction results"""
    try:
        # Store in Redis for quick access
        key = f"predictions:{organization_id}:{user_id}:{predictions['model_type']}"
        await redis_client.setex(key, 86400, str(predictions))  # 24 hours
        
        logger.info(f"Prediction results stored for user {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to store prediction results: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3004)),
        reload=settings.DEBUG
    )
