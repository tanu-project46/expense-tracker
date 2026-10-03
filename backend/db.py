import psycopg2
import os 
from dotenv import load_dotenv
load_dotenv()

conn= psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

def create_users_table():
    cursor = conn.cursor()
    cursor.execute(
        """CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL
        )"""
    )
    conn.commit()
    cursor.close()
#add user

def add_user(name, email, password):
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, password))
    conn.commit()
    cursor.close()

#get user by email

def get_user_by_email(email):
    cursor = conn.cursor()
    cursor.execute(
        """SELECT id, name, email, password FROM users WHERE email = %s""",
        (email,)
    )
    user = cursor.fetchone()
    cursor.close()
    return user

create_users_table()