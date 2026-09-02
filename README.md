# HUELLITAS VITALES

A veterinary management platform that connects clients, veterinarians, and staff in one place — from booking appointments to managing pet records and shopping for pet products.

## Features

- **Appointment Booking** – Clients can schedule, reschedule, or cancel veterinary appointments online.
- **Marketplace** – Buy pet products and book additional services (grooming, boarding, etc.).
- **Pet Management (CRUD)** – Create, view, update, and delete pet profiles, including medical history.
- **Role-Based Dashboards**
  - **Client Panel**: Manage pets, appointments, and orders.
  - **Veterinarian Panel**: View schedule, manage patient records, update consultation notes.
  - **Staff Panel**: Handle front-desk operations, appointment assignments, and inventory.
- **Reports** – Generate reports on appointments, sales, and clinic performance.

## Tech Stack

- **Frontend**: React / Angular
- **Backend**: .NET Core
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel (frontend) & Render (backend)

## Getting Started

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
npm install

# Run the app
npm start
```

## Roles

| Role         | Access                                              |
|--------------|------------------------------------------------------|
| Client       | Book appointments, buy from marketplace, manage pets |
| Veterinarian | Manage schedule, patient records, consultations       |
| Staff        | Manage front-desk, appointments, inventory            |