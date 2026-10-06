# 💰 Expense Tracker
A full-stack Expense Tracker application build with React and Flask that helps users manage income and expenses, track their balance, visualize spending, and get AI-powerd budget advice.

## ✨ Features

- 🔐 User registration and login
- 💰 Add, edit, and delete income and expenses
- 📊 Income vs Expense pie chart
- 📈 Monthly income and expense bar chart
- 💵 Automatic balance calculation
- 📅 Monthly budget tracking
- 🤖 AI-powered Budget Planner
- 💬 AI chatbot for budget-related questions
- 📱 Responsive design for mobile and desktop
- 🗄️ PostgreSQL database for user information
- 📄 Excel file storage for transactions

## 🛠️ Technologies Used

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Recharts

### Backend
- Python
- Flask
- Flask-CORS

### Database
- PostgreSQL

### Data Storage
- Excel (`transactions.xlsx`)

### AI
- Google Gemini API

### Tools
- VS Code
- Git & GitHub

## 📁 Project Structure

```text
expense-tracker/
│
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── ai_service.py
│   ├── requirements.txt
│   └── transactions.xlsx
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── AIBudgetPlanner.jsx
│   │   └── App.jsx
│   │
│   └── package.json
│
├── .gitignore
└── README.md

## 🚀 How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/tanu-project46/expense-tracker.git
cd expense-tracker

### 2.Backend Setup
cd backend
pip install -r requirements.txt
python app.py

### 3.Frontend Setup
cd frontend
npm install
npm run dev

### 4. Environment variable

Create a .env file inside the backend folder and add your own database and AI API credentials.


## 📌 Project Overview

The Expense Tracker is a full-stack web application designed to help users manage their personal finances.

Users can register and log in securely, record their income and expenses, monitor their balance, and visualize their financial activity through interactive charts.

The application also includes an AI Budget Planner that provides budget-related suggestions and answers questions based on the user's budget and spending information.

The project demonstrates practical use of **React, Python, Flask, PostgreSQL, Excel data handling, REST APIs, and AI integration**.

## 🌐 Deployment

The application is deployed using:

- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL on Render

## 📄 License

This project was created for learning and portfolio purposes.