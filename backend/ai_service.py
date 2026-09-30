import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client =genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
def ask_ai(message, budget=0, spent=0, remaining=0, remaining_days=0,transactions=None):
    transaction_text = json.dumps(transactions, indent=2, default=str) if transactions else "No transactions available"
    prompt = f"""
    You are an AI budget planner inside an expense Tracker application.
    User's monthly budget :₹{budget}
    User's total expenses :₹{spent}
    User's remaining budget :₹{remaining}
    Remaining days in the month :{remaining_days}
    User's transactions: {transaction_text}
    User's question: {message}
    
    use the user's transaction history to answer the user's question about where they spend money , spending categories, and how to manage their budget effectively.
    
    use financial information above when answering the user's question.
    Give simple, practical and personalized budgeting advice based on the user's budget, expenses, and remaining budget.
    keep the response concise and easy to understand. Do not give investment, loan or financial product recommendation."""
    response=client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_level="minimal"
            )
        )
    )
    return response.text