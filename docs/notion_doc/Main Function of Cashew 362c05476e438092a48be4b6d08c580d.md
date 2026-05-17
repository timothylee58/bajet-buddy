# Main Function of Cashew

Since you are in the middle of a hackathon and looking for a structural reference, **Cashew—Expense Budget Tracker** is a great example of a "Flat Hierarchy" design. It typically uses a **4 or 5-tab navigation system** that separates high-frequency actions (adding expenses) from low-frequency management (adjusting accounts).

Here is the structural breakdown of the app’s pages and their core functionality:

### 1. Main Navigation (The Bottom Bar)

The app is organized into five primary top-level destinations:

- **Homepage (Dashboard):**
    - **Functionality:** Provides a "at-a-glance" financial health check.
    - **Components:** A **Pie Chart** (spending by category), a **Heatmap** (frequency of spending), and a list of **Recent/Upcoming Transactions**.
- **All Spending (Transactions):**
    - **Functionality:** A searchable, filterable ledger of every money event.
    - **Components:** List view with icons, date grouping, and a robust **Search/Filter bar** (filter by account, category, or date range).
- **Calendar:**
    - **Functionality:** Visualizes cash flow over time.
    - **Components:** A monthly grid showing daily totals, helping users spot "heavy spending" days.
- **Budgets:**
    - **Functionality:** Planning and constraints.
    - **Components:** Progress bars for total spending vs. limits, **Category Goals** (e.g., "Only $200 on Dining Out"), and a **History** tab to compare against previous months.
- **More (Management & Settings):**
    - **Functionality:** The "engine room" where you configure the app.
    - **Sections:** Accounts management, Recurring/Subscriptions, Goals tracking, and App Settings.

---

### 2. Key Functional Workflows

If you are architecting your own app, pay attention to how Cashew handles these "sub-pages":

| **Feature** | **Functionality / UI Pattern** |
| --- | --- |
| **Add Transaction** | A multi-step or "Quick Add" popup. It usually asks for: **Title** (with auto-suggestions), **Category**, and **Amount**. |
| **Account Switcher** | Found on the Homepage; allows users to toggle between "Cash," "Bank," or "Credit Card" to see specific totals. |
| **Recurring / Subscriptions** | A dedicated list for "Future Transactions." It uses **Reminders/Notifications** to alert users before a bill is due. |
| **Goal Tracking** | A progress-based UI where users "assign" transactions to a specific goal (e.g., "New Keyboard Fund") until the target is hit. |
| **Data Portability** | Import/Export logic for **CSV** and **Google Sheets**, plus **Google Drive** for cloud syncing. |

### 3. Structural Tips for Your Hackathon

- **The "Plus" Button:** Like Cashew, place your "Add" action in a prominent **Floating Action Button (FAB)** or a centered tab. This is the most used feature in any tracking app.
- **The "More" Catch-all:** Don't clutter your main UI with "Settings" or "Profile." Move everything that isn't essential for *daily* use into a "More" or "Settings" tab.
- **State Management:** If you're building this in Flutter or React Native, notice how Cashew uses a **Primary Account**to set the global currency/totals. You'll need a global state to ensure the Pie Chart updates immediately when a transaction is added.

Are you planning to follow a similar 5-tab structure, or are you going for a more minimal, single-page dashboard?