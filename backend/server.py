"""
FastAPI Proxy Server — Routes all /api/* requests to Next.js on port 3000.
The Kubernetes ingress sends /api/* to port 8001. This proxy forwards
those requests to the Next.js API routes running on port 3000.
"""
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response
import httpx

app = FastAPI()

NEXTJS_URL = "http://localhost:3000"

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_to_nextjs(request: Request, path: str):
    url = f"{NEXTJS_URL}/api/{path}"
    
    # Forward query params
    if request.url.query:
        url += f"?{request.url.query}"
    
    # Forward headers (skip hop-by-hop headers)
    skip_headers = {"host", "connection", "transfer-encoding"}
    headers = {k: v for k, v in request.headers.items() if k.lower() not in skip_headers}
    
    # Read body for non-GET requests
    body = await request.body() if request.method != "GET" else None
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )
    
    # Forward response headers
    resp_headers = {k: v for k, v in response.headers.items() 
                    if k.lower() not in {"content-encoding", "transfer-encoding", "connection"}}
    
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=resp_headers,
    )

@app.get("/health")
async def health():
    return {"status": "ok", "proxy": True}
