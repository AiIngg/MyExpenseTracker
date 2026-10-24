# MyExpenseTracker

A personal expense tracking web application built with **Angular**, **ASP.NET Core Web API**, and **Oracle Database**.

This project is developed to practice full-stack web development by building a system for managing income, expenses, budgets, and debts.

## Features

### Web Application

- **Overview** — A dashboard for reviewing financial information.
- **Transaction Management** — Manage income and expense records, including amounts, dates, categories, and payment methods.
- **Debt Management** — Organize debt-related records. Track debts between people, including money you owe to others, money others owe you, and the final outstanding balance to determine who owes whom and how much.
- **Budget Management** — Organize budgets by category and month.

### Backend & Database

- **RESTful API** — Provides endpoints for creating, retrieving, updating, and deleting financial records.
- **Oracle Database Integration** — Stores and retrieves financial data using Oracle Database.

*Note: Some features and frontend-backend integrations are still under development.*

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Angular, TypeScript, HTML, CSS |
| Backend | C#, ASP.NET Core Web API |
| Database | Oracle Database |
| Database Client | Oracle SQL Developer |
| Development Tools | Visual Studio Code, Git, GitHub |

## Project Structure

```text
MyExpenseTracker/
├── frontend/    # Angular frontend application
├── backend/     # C# ASP.NET Core Web API
├── database/    # Database scripts (planned)
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following tools before running the project:

- [Node.js and npm](https://nodejs.org/en/download)
- [Angular CLI](https://angular.dev/tools/cli)
- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download)
- [Oracle Database Free](https://www.oracle.com/database/free/)

[Oracle SQL Developer](https://www.oracle.com/database/sqldeveloper/) can be used to manage the database and execute SQL statements.

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/AiIngg/MyExpenseTracker.git
cd MyExpenseTracker
```

### 2. Run the Frontend

Open a terminal in the project root and run:

```bash
cd frontend
npm install
ng serve --port 4300
```

Open [http://localhost:4300](http://localhost:4300) in your browser.

### 3. Configure the Database Connection

Make sure Oracle Database is running and the required database user and tables have been created.

Configure the Oracle connection string in your local backend settings. For example, create `backend/appsettings.Development.json` with your own database credentials:

```json
{
  "ConnectionStrings": {
    "OracleDb": "User Id=YOUR_USERNAME;Password=YOUR_PASSWORD;Data Source=localhost:1521/freepdb1"
  }
}
```

Replace the example username and password with your own settings. Update the data source if your Oracle Database uses a different host, port, or service name.

**Security:** Never commit database passwords or other secrets to GitHub.

### 4. Run the Backend

Open a separate terminal and run:

```bash
cd backend
dotnet restore
dotnet run
```

Check the terminal output for the backend URL. Make sure the frontend's API base URL matches the address where the backend is running.

## Development Goals

- Complete frontend and backend integration.
- Improve transaction, budget, and debt management.
- Enhance input validation and error handling.
- Refine the user interface and user experience.
- Prepare the application for deployment.

## Author

Developed as a personal full-stack learning project to practice frontend development, backend API design, Oracle database integration, and version control.