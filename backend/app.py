from flask import Flask, request, jsonify, send_file
from datetime import date, timedelta
from flask_cors import CORS
import io
from db import add_user, get_user_by_email
import os
import pandas as pd
from ai_service import ask_ai

Excel_File ="transactions.xlsx"

def create_excel_file():
    if not os.path.exists(Excel_File):
        columns=["ID", "User Email", "Amount", "Description", "Type"]
        df = pd.DataFrame(columns=columns)
        df.to_excel(Excel_File, index=False)


app = Flask(__name__)

CORS(app)


# -------------------------
# TEST API
# -------------------------

@app.route("/")
def home():
    return "Expense Tracker Backend is Running!"


# -------------------------
# REGISTER USER
# -------------------------

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({
            "error": "All fields are required"
        }), 400

    existing_user = get_user_by_email(email)

    if existing_user:
        return jsonify({
            "error": "Email already registered"
        }), 409

    add_user(name, email, password)

    return jsonify({
        "message": "User registered successfully"
    }), 201


# -------------------------
# LOGIN USER
# -------------------------

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = get_user_by_email(email)

    if not user:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    if user[3] != password:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user[0],
            "name": user[1],
            "email": user[2]
        }
    }), 200

create_excel_file()

def add_transaction_to_excel(user_email, amount, description, transaction_type):
    # Read or initialize the Excel file; raise on failure so caller can handle it
    if os.path.exists(Excel_File):
        df = pd.read_excel(Excel_File)
    else:
        df = pd.DataFrame(columns=["ID", "User Email", "Amount", "Description", "Type","Date"]) 

    # Ensure required columns exist (in case file had different casing)
    cols_lower = {c.lower(): c for c in df.columns}
    # Try to compute a new ID robustly
    if "id" in cols_lower:
        id_col = cols_lower["id"]
        try:
            new_id = 1 if df.empty else int(df[id_col].max()) + 1
        except Exception:
            new_id = len(df) + 1
        id_field = id_col
    else:
        new_id = len(df) + 1
        id_field = "ID"

    new_transaction = {
        id_field: new_id,
        # store with the human-friendly column name
        "User Email": user_email,
        "Amount": amount,
        "Description": description,
        "Type": transaction_type,
        "Date":date.today().isoformat()
    }

    df = pd.concat([df, pd.DataFrame([new_transaction])], ignore_index=True, sort=False)
    # Write back with consistent column order
    preferred_cols = [c for c in [id_field, "User Email", "Amount", "Description", "Type","Date"] if c in df.columns]
    try:
        df.to_excel(Excel_File, index=False, columns=preferred_cols)
    except Exception:
        df.to_excel(Excel_File, index=False)

def get_user_transactions(user_email):
    try:
        df=pd.read_excel(Excel_File)
        user_transactions=df[(df["User Email"] == user_email) & (df["Type"].str.lower()=="expense")]
        print("AI USER EmMAIL:",user_email)
        print("AI TRANSACTION:",user_transactions.to_dict(orient="records"))
        return  user_transactions.to_dict(orient="records")
    except Exception as e:
         print("Error reading transactions:",e)
         return []

@app.route("/api/expenses", methods=["POST"])
def create_expense():
    data = request.get_json()
    # Accept either 'user_email' or 'email' from client
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    user_email = data.get("user_email") or data.get("email")
    amount = data.get("amount")
    description = data.get("description")
    transaction_type = data.get("type") or data.get("transaction_type")

    # Validate required fields
    missing = []
    if not user_email:
        missing.append("user_email")
    if amount is None:
        missing.append("amount")
    if not description:
        missing.append("description")
    if not transaction_type:
        missing.append("type")

    if missing:
        return jsonify({"error": "Missing fields", "missing": missing}), 400

    # Coerce amount to number
    try:
        amount = float(amount)
    except Exception:
        return jsonify({"error": "Invalid amount; must be a number"}), 400

    try:
        add_transaction_to_excel(user_email, amount, description, transaction_type)
    except Exception as e:
        return jsonify({"error": f"Failed to save transaction: {e}"}), 500

    return jsonify({"message": "Expense added successfully"}), 201


@app.route("/api/expenses", methods=["GET"])
def expenses():
    # Return transactions, optionally filtered by ?email=<user email>
    email = request.args.get("email")
    try:
        df = pd.read_excel(Excel_File)
    except Exception as e:
        return jsonify({"error": f"Failed to read data source: {e}"}), 500

    # Normalize column names to handle different casings or naming
    df.columns = [str(c).strip() for c in df.columns]
    cols_lower = {c.lower(): c for c in df.columns}

    if email:
        # Find the best matching email column
        email_col = None
        for candidate in ("user email", "user_email", "email"):
            if candidate in cols_lower:
                email_col = cols_lower[candidate]
                break

        if email_col is None:
            # No email column — return empty result instead of raising KeyError
            filtered = df.iloc[0:0]
        else:
            filtered = df[df[email_col] == email]
    else:
        filtered = df

    transactions = filtered.fillna("").to_dict(orient="records")
    return jsonify({"transactions": transactions}), 200


# PUT/UPDATE route
@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        df = pd.read_excel(Excel_File)
    except Exception as e:
        return jsonify({"error": f"Failed to read data source: {e}"}), 500

    df.columns = [str(c).strip() for c in df.columns]
    cols_lower = {c.lower(): c for c in df.columns}

    # Find ID column
    if "id" in cols_lower:
        id_col = cols_lower["id"]
    else:
        return jsonify({"error": "ID column not found in data source"}), 500

    # Locate the row
    try:
        mask = pd.to_numeric(df[id_col], errors="coerce") == int(expense_id)
    except Exception:
        mask = df[id_col] == expense_id

    if not mask.any():
        return jsonify({"error": "Expense not found"}), 404

    idx = df[mask].index[0]

    # Map possible incoming fields to dataframe columns
    def find_col(*candidates):
        for cand in candidates:
            if cand in cols_lower:
                return cols_lower[cand]
        return None

    email_col = find_col("user email", "user_email", "email")
    amount_col = find_col("amount") or "Amount"
    desc_col = find_col("description") or "Description"
    type_col = find_col("type", "transaction_type") or "Type"

    # Apply updates if provided
    if "user_email" in data or "email" in data:
        if email_col:
            df.at[idx, email_col] = data.get("user_email") or data.get("email")

    if "amount" in data:
        try:
            df.at[idx, amount_col] = float(data.get("amount"))
        except Exception:
            return jsonify({"error": "Invalid amount; must be a number"}), 400

    if "description" in data:
        df.at[idx, desc_col] = data.get("description")

    if "type" in data or "transaction_type" in data:
        df.at[idx, type_col] = data.get("type") or data.get("transaction_type")

    try:
        df.to_excel(Excel_File, index=False)
    except Exception as e:
        return jsonify({"error": f"Failed to write data source: {e}"}), 500

    updated = df.loc[idx].fillna("").to_dict()
    return jsonify({"message": "Expense updated", "expense": updated}), 200


# DELETE route
@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    try:
        df = pd.read_excel(Excel_File)
    except Exception as e:
        return jsonify({"error": f"Failed to read data source: {e}"}), 500

    df.columns = [str(c).strip() for c in df.columns]
    cols_lower = {c.lower(): c for c in df.columns}

    if "id" in cols_lower:
        id_col = cols_lower["id"]
    else:
        return jsonify({"error": "ID column not found in data source"}), 500

    try:
        mask = pd.to_numeric(df[id_col], errors="coerce") == int(expense_id)
    except Exception:
        mask = df[id_col] == expense_id

    if not mask.any():
        return jsonify({"error": "Expense not found"}), 404

    df = df[~mask]
    try:
        df.to_excel(Excel_File, index=False)
    except Exception as e:
        return jsonify({"error": f"Failed to write data source: {e}"}), 500

    return jsonify({"message": "Expense deleted"}), 200


# 👇 ADD EXPORT ROUTE HERE
@app.route("/api/export", methods=["GET"])
def export_excel():
    df = pd.read_excel(Excel_File)

    output = io.BytesIO()

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(
            writer,
            index=False,
            sheet_name="Transactions"
        )

    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="transactions.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.route("/api/analysis", methods=["GET"])
def analysis():
    user_email=request.args.get("email")
    df = pd.read_excel(Excel_File)
    if user_email:
        df=df[df["User Email"]==user_email]
    total_income = df[df["Type"]=="Income"]["Amount"].sum()
    total_expense = df[df["Type"]=="Expense"]["Amount"].sum()
    balance = total_income - total_expense

    return jsonify({
        "total_income":total_income,
        "total_expense":total_expense,
        "balance":balance
    })

@app.route("/api/ai-budget",methods=["POST"])
def ai_budget():
    data = request.get_json()
    message = data.get("message","").strip()
    budget = data.get("budget", 0)
    spent = data.get("spent", 0)
    remaining = data.get("remaining", 0)
    user_email=data.get("user_email") or data.get("email")

    transactions=get_user_transactions(user_email)

    today= date.today()
    next_month= today.replace(day=28) + timedelta(days=4)
    last_day= next_month-timedelta(days=next_month.day)

    remaining_days=(last_day-today).days+1

    if not message:
        return jsonify({"error":"message is required"}),400
   
    reply = ask_ai(
        message,
        budget,
        spent,
        remaining,
        remaining_days,
        transactions
    )
    return jsonify({"reply":reply})
# -------------------------
# START FLASK
# -------------------------

if __name__ == "__main__":
    app.run(debug=True)