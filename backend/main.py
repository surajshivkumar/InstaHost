import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router  # Import the router that handles your routes

# Initialize the FastAPI app
app = FastAPI()

# Set up CORS middleware to allow requests from different origins (e.g., from your frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router from your `routes.py` file
app.include_router(router)

# Entry point for running the FastAPI app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
