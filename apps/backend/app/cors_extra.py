import os
from fastapi.middleware.cors import CORSMiddleware

def _split_csv(val: str):
    return [x.strip().rstrip("/") for x in val.split(",") if x.strip()]

def install_cors(app):
    origins = []
    # Primary single origin (no trailing slash)
    one = os.getenv("FRONTEND_ORIGIN", "").strip().rstrip("/")
    if one:
        origins.append(one)
    # Optional comma-separated extra origins (no trailing slashes)
    extra = os.getenv("FRONTEND_ORIGINS", "")
    origins += _split_csv(extra)

    # Allow all Vercel deployments by default (prod/preview): https://*.vercel.app
    allow_origin_regex = os.getenv("ALLOW_ORIGIN_REGEX", r"^https://.*\.vercel\.app$")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        max_age=600,
    )
