# KBPIMSR Enquiry Management System (EMS)

A comprehensive, full-stack Admission Enquiry & Lead Management System built for **Karmaveer Bhaurao Patil Institute of Management Studies and Research (KBPIMSR), Satara**.

- **Frontend**: React 19 + Vite + Lucide Icons + Recharts + Bootstrap 5
- **Backend**: Python Django REST Framework (DRF) + Token Authentication + Whitenoise + Gunicorn
- **Database**: External MySQL (with automatic SQLite fallback)
- **Deployment**: Render (Blueprint `render.yaml` for both Backend & Frontend)

---

## 🏛️ Project Structure

```text
├── backend/            # Django project settings, WSGI, URLs
├── core/               # Django EMS application (models, views, APIs, serializers, routing logic)
│   ├── management/
│   │   └── commands/
│   │       └── seed_data.py   # Initial seeding for roles, courses, demo enquiries
│   └── migrations/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # StudentPortal, AdminPortal, SuperAdminPortal, FacultyPortal, ChatbotWidget, Login
│   │   └── App.jsx
│   └── package.json
├── build.sh            # Production build & database migration script for Render
├── render.yaml         # Render Blueprint configuration (Backend API + Frontend Static Site)
├── requirements.txt    # Python production dependencies
└── README.md
```

---

## 🚀 One-Click Render Deployment

This repository includes a preconfigured **Render Blueprint** (`render.yaml`) that automatically provisions both the Django API and the React Frontend Static Site in one workflow.

### Deployment Steps:

1. **Log in to [Render](https://dashboard.render.com/)**.
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository:
   ```
   https://github.com/adityakamble884-lang/KBPIMSR
   ```
4. Render will detect `render.yaml` and configure:
   - **`kbpimsr-ems-api`** (Python Web Service): Runs `build.sh` (installs packages, migrates, and auto-seeds initial accounts).
   - **`kbpimsr-ems-frontend`** (Static Site): Builds React with Vite and automatically links to `kbpimsr-ems-api`.
5. Click **Apply**.
6. Once deployed:
   - **Frontend URL**: `https://kbpimsr-ems-frontend.onrender.com`
   - **Backend API URL**: `https://kbpimsr-ems-api.onrender.com`

*(Note: If a name is already taken globally on Render, Render appends a unique random suffix to the domain, visible in your Render dashboard).*

---

## 👥 Default Demo Credentials

The system automatically initializes these demo accounts upon deployment:

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `admin123` | Full access, user management, FAQ management, system config, audit logs |
| **Admin** | `admin` | `admin123` | Analytics dashboard, enquiry allocation oversight, reports |
| **Faculty 1** | `faculty1` | `admin123` | Faculty workspace, student follow-ups, interaction logging |
| **Faculty 2** | `faculty2` | `admin123` | Faculty workspace, student follow-ups, interaction logging |
| **Faculty 3** | `faculty3` | `admin123` | Faculty workspace, student follow-ups, interaction logging |

---

## 🗄️ Database Configuration

By default, the application runs on SQLite out-of-the-box for instant testing and zero-setup deployment.

To connect your own **MySQL** database (e.g. Aiven, Clever Cloud, AWS RDS, TiDB, Railway):
Configure these environment variables in your Render service dashboard:
- `MYSQL_HOST`
- `MYSQL_PORT` (default: 3306)
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

---

## 💻 Local Development

### 1. Backend Setup:
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data   # seeds sample users & enquiries
python manage.py runserver
```

### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
By default, the Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`.
