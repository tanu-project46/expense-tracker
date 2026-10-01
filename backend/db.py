import psycopg2
import os 
from dotenv import load_dotenv
conn= psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

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