from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .api.routers import fair, optimization, ml, assets, admin, compliance, audit, reports
from .auth.dependencies import get_current_user

app = FastAPI(
    title="CYBERVEST API",
    description="AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform",
    version="1.0.0"
)

import os

# Parse CORS origins from environment, defaulting to empty to prevent wildcard usage
cors_origins_str = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CYBERVEST API is running."}

# Protected Routes
app.include_router(fair.router, prefix="/api/fair", tags=["FAIR Risk Engine"])
app.include_router(optimization.router, prefix="/api/optimization", tags=["Optimization Engine"])
app.include_router(ml.router, prefix="/api/ml", tags=["ML Engine"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets & Vulnerabilities"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance Engine"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Activity"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

from .api.routers import ai
app.include_router(ai.router, prefix="/api/ai", tags=["AI Orchestration"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("risk_engine.main:app", host="0.0.0.0", port=8000, reload=True)
