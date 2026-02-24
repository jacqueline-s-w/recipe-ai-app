from fastapi import FastAPI
from fastapi.responses import Response
app= FastAPI()
from fastapi.middleware.cors import CORSMiddleware;

from routes.recipes import router as recipes_router
from routes.generate_recipe import router as generate_recipes_router





app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(recipes_router, prefix="/api")
app.include_router(generate_recipes_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Backend läuft!"}

@app.get("/favicon.ico")
async def favicon():
 return Response(status_code=204)
