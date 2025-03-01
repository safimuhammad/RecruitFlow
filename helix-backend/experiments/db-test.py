import psycopg2

DB_NAME = "mydatabase"
DB_USER = "postgres"
DB_PASSWORD = "password"
DB_HOST = "localhost"   
DB_PORT = "5432"

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    print("Connected to PostgreSQL successfully!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print("PostgreSQL Version:", cur.fetchone())
    cur.close()
    conn.close()
except Exception as e:
    print("Error connecting to PostgreSQL:", e)