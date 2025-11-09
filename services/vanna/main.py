from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, List, Dict
import os
import psycopg
from psycopg.rows import dict_row
from psycopg.conninfo import conninfo_to_dict
from dotenv import load_dotenv

# --- Load .env ---
load_dotenv()  # loads services/vanna/.env

app = FastAPI()

DB_URL = os.getenv("DATABASE_URL")

def mask_url(url: str) -> str:
    if not url:
        return ""
    try:
        d = conninfo_to_dict(url)
        pw = d.get("password") or d.get("passfile") or ""
        if pw:
            return url.replace(pw, "****")
        return url
    except Exception:
        return url[:30] + "...(masked)"

@app.get("/health")
def health():
    # Check env present
    if not DB_URL:
        return {"status": "error", "reason": "DATABASE_URL missing"}
    # Try a trivial DB query
    try:
        with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 as ok;")
                row = cur.fetchone()
        return {"status": "ok", "db": row, "db_url": mask_url(DB_URL)}
    except Exception as e:
        return {"status": "error", "reason": str(e), "db_url": mask_url(DB_URL)}

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    sql: str
    rows: List[Dict[str, Any]]

def naive_sql_generator(question: str) -> str:
    q = (question or "").lower()
    if "total spend" in q:
        return 'SELECT SUM("totalAmount") AS total_spend FROM "Invoice";'
    if "top" in q and "vendor" in q:
        return '''
        SELECT v.name AS vendor, SUM(i."totalAmount") AS spend
        FROM "Invoice" i JOIN "Vendor" v ON v.id = i."vendorId"
        GROUP BY v.name
        ORDER BY spend DESC
        LIMIT 5;
        '''
    if "overdue" in q:
        return '''
        SELECT i."invoiceNo", v.name AS vendor, i."dueDate", i.status
        FROM "Invoice" i JOIN "Vendor" v ON v.id = i."vendorId"
        WHERE i.status ILIKE 'overdue'
           OR (i."dueDate" < NOW() AND i.status NOT ILIKE 'paid')
        ORDER BY i."dueDate" ASC;
        '''
    return 'SELECT id, "invoiceNo", status, "totalAmount" FROM "Invoice" ORDER BY "issueDate" DESC LIMIT 20;'

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not DB_URL:
        # fail early with clear message
        raise RuntimeError("DATABASE_URL is missing; put it in services/vanna/.env")

    sql = naive_sql_generator(req.question)
    try:
        with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        return ChatResponse(sql=sql, rows=rows)
    except Exception as e:
        # log full details to the console and return a readable message
        print("[/chat] ERROR executing SQL:\n", sql, "\nException:", repr(e))
        # Raising lets FastAPI return 500 to the client; message appears in server logs
        raise
