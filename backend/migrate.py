import pandas as pd
import sqlite3
import os

EXCEL_FILE = os.path.join(os.path.dirname(__file__), "..", "BASE DE DADOS.xlsx")
DB_FILE = os.path.join(os.path.dirname(__file__), "database.db")

def migrate():
    print(f"Lendo dados de {EXCEL_FILE}...")
    if not os.path.exists(EXCEL_FILE):
        print("Arquivo Excel não encontrado. Nada a migrar.")
        return
    
    try:
        df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
    except Exception as e:
        print(f"Erro ao ler o Excel: {e}")
        return
        
    df = df.fillna("")
    
    for col in ["Data de Início", "Data de Fim", "Dia de Retorno"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
            df[col] = df[col].replace('NaT', '')
            df[col] = df[col].fillna('')
            
    print(f"Conectando ao banco de dados SQLite {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
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
    
    # Limpa a tabela antes de inserir (caso o script seja rodado mais de uma vez)
    cursor.execute('DELETE FROM vacations')
    
    inserted = 0
    for index, row in df.iterrows():
        nome = str(row.get("Nome", ""))
        inicio = str(row.get("Data de Início", ""))
        fim = str(row.get("Data de Fim", ""))
        retorno = str(row.get("Dia de Retorno", ""))
        dias = row.get("Dias de Férias", 0)
        try:
            dias = int(dias) if dias else 0
        except ValueError:
            dias = 0
            
        status = str(row.get("Status", ""))
        
        if not nome or not inicio:
            continue
            
        cursor.execute('''
        INSERT INTO vacations (nome, data_inicio, data_fim, dia_retorno, dias_ferias, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (nome, inicio, fim, retorno, dias, status))
        inserted += 1
        
    conn.commit()
    conn.close()
    
    print(f"Migração concluída com sucesso! {inserted} registros inseridos.")

if __name__ == "__main__":
    migrate()
