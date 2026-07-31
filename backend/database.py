import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "database.db")

def get_connection():
    # Helper to get a db connection
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_FILE):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS vacations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            data_inicio TEXT NOT NULL,
            data_fim TEXT,
            dia_retorno TEXT,
            dias_ferias INTEGER,
            status TEXT
        )
        ''')
        conn.commit()
        conn.close()

# Ensure the DB is initialized when this module is imported
init_db()

def get_all_vacations():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vacations ORDER BY id ASC")
        rows = cursor.fetchall()
        
        records = []
        for row in rows:
            records.append({
                "id": row["id"],
                "Nome": row["nome"],
                "Data de Início": row["data_inicio"],
                "Data de Fim": row["data_fim"],
                "Dia de Retorno": row["dia_retorno"],
                "Dias de Férias": row["dias_ferias"],
                "Status": row["status"]
            })
        conn.close()
        return records
    except Exception as e:
        print(f"Error reading SQLite: {e}")
        return []

def add_vacation(vacation_data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO vacations (nome, data_inicio, data_fim, dia_retorno, dias_ferias, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            vacation_data.get("Nome", ""),
            vacation_data.get("Data de Início", ""),
            vacation_data.get("Data de Fim", ""),
            vacation_data.get("Dia de Retorno", ""),
            vacation_data.get("Dias de Férias", 0),
            vacation_data.get("Status", "")
        ))
        conn.commit()
        conn.close()
        return True, "Success"
    except Exception as e:
        return False, str(e)

def update_vacation(id: int, vacation_data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
        UPDATE vacations 
        SET nome = ?, data_inicio = ?, data_fim = ?, dia_retorno = ?, dias_ferias = ?, status = ?
        WHERE id = ?
        ''', (
            vacation_data.get("Nome", ""),
            vacation_data.get("Data de Início", ""),
            vacation_data.get("Data de Fim", ""),
            vacation_data.get("Dia de Retorno", ""),
            vacation_data.get("Dias de Férias", 0),
            vacation_data.get("Status", ""),
            id
        ))
        conn.commit()
        
        # Check if any row was affected
        if cursor.rowcount == 0:
            conn.close()
            return False, "Record not found"
            
        conn.close()
        return True, "Success"
    except Exception as e:
        return False, str(e)

def delete_vacation(id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vacations WHERE id = ?', (id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            return False, "Record not found"
            
        conn.close()
        return True, "Success"
    except Exception as e:
        return False, str(e)
