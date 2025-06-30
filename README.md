# Ophelia - Money Manager

Ophelia is a comprehensive money management and accounting application designed to help users track expenses, income, manage budgets, set savings goals, and gain insightful financial overviews. It leverages cutting-edge AI for personalized advice and reports, and includes traditional accounting features like journal entries, ledger accounts, and profit & loss statements for a complete financial management experience.

Try it out at: [Ophelia](https://admirable-macaron-4c4433.netlify.app/)
## Features

-   **User Authentication:** Secure sign-up and sign-in powered by Supabase.
-   **Expense Tracking:** Easily log and categorize daily expenses.
-   **Income Tracking:** Record various sources of income.
-   **Budget Management:** Set monthly budgets for different categories and track your spending against them.
-   **Savings Goal Tracking:** Create and monitor progress towards your financial goals, with deposit and withdrawal transactions.
-   **Financial Analytics & Reports:** Visualize your financial data with interactive charts and smart insights.
-   **Accounting Features:**
    -   **Journal Entries:** View a chronological record of all financial transactions.
    -   **Ledger Accounts:** See detailed records for each account, showing debits, credits, and balances.
    -   **Profit & Loss Statement:** Understand your revenue and expenses over a period to calculate net income.
    -   **Trial Balance:** Verify the equality of debits and credits in your ledger accounts.
-   **AI Financial Advisor:** Get personalized financial advice, recommendations, and key insights based on your spending patterns and goals, powered by PicaHQ.
-   **AI-Generated Reports:** Generate detailed financial reports (monthly summaries, spending analysis, savings progress, financial health assessments) with AI-powered summaries and recommendations.
-   **AI-Generated Onboarding Videos:** Experience personalized onboarding and celebration videos powered by Tavus.
-   **Multi-language Support:** The application is available in multiple languages, thanks to `i18next`.
-   **Offline Mode:** Basic support for adding transactions while offline, with automatic syncing when connectivity is restored.
-   **Data Management:** Export and import your financial data for backup and migration.

## Technologies Used

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** Tailwind CSS
-   **Icons:** Lucide React
-   **State Management:** React Hooks
-   **Database & Authentication:** Supabase
-   **Charts:** Recharts
-   **Internationalization:** i18next
-   **AI Services:** PicaHQ (via Supabase Edge Functions)
-   **AI Video Generation:** Tavus

## Setup and Installation

To get a local copy of Ophelia up and running, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ophelia-money-manager.git
    cd ophelia-money-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    -   Go to [Supabase](https://supabase.com/) and create a new project.
    -   Navigate to the `SQL Editor` and run the SQL scripts located in the `supabase/migrations` directory to set up your database schema. Ensure you run them in chronological order.
    -   Enable Row Level Security (RLS) for all tables as defined in the migration files.
    -   Deploy the Supabase Edge Functions located in `supabase/functions` (e.g., `financial-advice`, `budget-adjustments`, `automated-report`, `tavus-webhook`).

4.  **Configure Environment Variables:**
    -   Create a `.env` file in the root of your project.
    -   Add your Supabase project URL and `anon` key to this file:
        ```
        VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
        VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        ```
    -   If you are using Tavus, you might also need to configure `TAVUS_WEBHOOK_SECRET` in your Supabase Edge Function environment variables for webhook verification.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

## Usage

-   **Sign Up/Sign In:** Create an account or log in to start managing your finances.
-   **Navigate:** Use the navigation bar to switch between different sections like Expenses, Income, Savings, Budgets, Analytics, Accounts, AI Advisor, and Reports.
-   **Add Data:** Input your financial transactions, set up budgets, and define savings goals.
-   **Explore Insights:** Check the Analytics and AI Advisor tabs for detailed reports and personalized financial guidance.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
