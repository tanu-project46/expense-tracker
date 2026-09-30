import psycopg2

conn= psycopg2.connect(
    host="localhost",
    database="expense_tracker",
    user="postgres",
    password="root",
    port="5432"
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