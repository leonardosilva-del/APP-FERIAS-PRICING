from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from .database import get_all_vacations, add_vacation, update_vacation, delete_vacation
from .database import get_all_links, add_link, update_link, delete_link
from datetime import datetime, timedelta
import os

app = FastAPI(title="Vacation Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VacationCreate(BaseModel):
    nome: str
    data_inicio: str
    data_fim: str = ""
    dias_ferias: int = 0
    status: str = ""

class LinkCreate(BaseModel):
    nome: str
    url: str

def get_return_day(data_fim_str):
    if not data_fim_str:
        return ""
    try:
        dt = datetime.strptime(data_fim_str, "%Y-%m-%d")
        dt += timedelta(days=1)
        while dt.weekday() >= 5: # 5 is Sat, 6 is Sun
            dt += timedelta(days=1)
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return ""

def get_status(data_inicio_str, data_fim_str):
    if not data_inicio_str or not data_fim_str:
        return "Agendado"
    try:
        inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d").date()
        fim = datetime.strptime(data_fim_str, "%Y-%m-%d").date()
        hoje = datetime.now().date()
        
        if hoje < inicio:
            return "Agendado"
        elif hoje > fim:
            return "Finalizada"
        else:
            return "Em Férias"
    except ValueError:
        return "Agendado"

@app.get("/api/vacations")
def read_vacations():
    records = get_all_vacations()
    for r in records:
        r["Status"] = get_status(r.get("Data de Início"), r.get("Data de Fim"))
        if "Dia de Retorno" not in r or not r["Dia de Retorno"]:
            r["Dia de Retorno"] = get_return_day(r.get("Data de Fim"))
    return {"data": records}

@app.post("/api/vacations")
def create_vacation(vacation: VacationCreate):
    if vacation.data_inicio and vacation.dias_ferias and not vacation.data_fim:
        try:
            inicio = datetime.strptime(vacation.data_inicio, "%Y-%m-%d")
            fim = inicio + timedelta(days=vacation.dias_ferias - 1)
            vacation.data_fim = fim.strftime("%Y-%m-%d")
        except ValueError:
            pass
    elif vacation.data_inicio and vacation.data_fim and not vacation.dias_ferias:
        try:
            inicio = datetime.strptime(vacation.data_inicio, "%Y-%m-%d")
            fim = datetime.strptime(vacation.data_fim, "%Y-%m-%d")
            vacation.dias_ferias = (fim - inicio).days + 1
        except ValueError:
            pass

    status = get_status(vacation.data_inicio, vacation.data_fim)
    retorno = get_return_day(vacation.data_fim)

    data = {
        "Nome": vacation.nome,
        "Data de Início": vacation.data_inicio,
        "Data de Fim": vacation.data_fim,
        "Dia de Retorno": retorno,
        "Dias de Férias": vacation.dias_ferias,
        "Status": status
    }
    success, msg = add_vacation(data)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to save to database: {msg}")
    return {"message": "Vacation added successfully"}

@app.put("/api/vacations/{id}")
def edit_vacation(id: int, vacation: VacationCreate):
    if vacation.data_inicio and vacation.dias_ferias and not vacation.data_fim:
        try:
            inicio = datetime.strptime(vacation.data_inicio, "%Y-%m-%d")
            fim = inicio + timedelta(days=vacation.dias_ferias - 1)
            vacation.data_fim = fim.strftime("%Y-%m-%d")
        except ValueError:
            pass
    elif vacation.data_inicio and vacation.data_fim and not vacation.dias_ferias:
        try:
            inicio = datetime.strptime(vacation.data_inicio, "%Y-%m-%d")
            fim = datetime.strptime(vacation.data_fim, "%Y-%m-%d")
            vacation.dias_ferias = (fim - inicio).days + 1
        except ValueError:
            pass

    status = get_status(vacation.data_inicio, vacation.data_fim)
    retorno = get_return_day(vacation.data_fim)

    data = {
        "Nome": vacation.nome,
        "Data de Início": vacation.data_inicio,
        "Data de Fim": vacation.data_fim,
        "Dia de Retorno": retorno,
        "Dias de Férias": vacation.dias_ferias,
        "Status": status
    }
    success, msg = update_vacation(id, data)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to update database: {msg}")
    return {"message": "Vacation updated successfully"}

@app.delete("/api/vacations/{id}")
def remove_vacation(id: int):
    success, msg = delete_vacation(id)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to delete from database: {msg}")
    return {"message": "Vacation deleted successfully"}

class DateCalcRequest(BaseModel):
    data_inicio: str
    data_fim: str = ""
    dias_ferias: int = 0

@app.post("/api/calculate")
def calculate_dates(req: DateCalcRequest):
    try:
        inicio = datetime.strptime(req.data_inicio, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid data_inicio format. Use YYYY-MM-DD")
    
    if req.data_fim and not req.dias_ferias:
        try:
            fim = datetime.strptime(req.data_fim, "%Y-%m-%d")
            diff = (fim - inicio).days + 1
            return {"data_inicio": req.data_inicio, "data_fim": req.data_fim, "dias_ferias": diff}
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid data_fim format.")
    elif req.dias_ferias and not req.data_fim:
        fim = inicio + timedelta(days=req.dias_ferias - 1)
        return {"data_inicio": req.data_inicio, "data_fim": fim.strftime("%Y-%m-%d"), "dias_ferias": req.dias_ferias}
    else:
        return req.dict()

# ===== Links Endpoints =====

@app.get("/api/links")
def read_links():
    records = get_all_links()
    return {"data": records}

@app.post("/api/links")
def create_link(link: LinkCreate):
    data = {"nome": link.nome, "url": link.url}
    success, msg = add_link(data)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to save link: {msg}")
    return {"message": "Link added successfully"}

@app.put("/api/links/{id}")
def edit_link(id: int, link: LinkCreate):
    data = {"nome": link.nome, "url": link.url}
    success, msg = update_link(id, data)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to update link: {msg}")
    return {"message": "Link updated successfully"}

@app.delete("/api/links/{id}")
def remove_link(id: int):
    success, msg = delete_link(id)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to delete link: {msg}")
    return {"message": "Link deleted successfully"}

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
