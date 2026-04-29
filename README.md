# AI-Powered Job Recruitment System

An AI-assisted recruitment platform with a FastAPI backend and React frontend that:

- parses uploaded CVs/resumes,
- extracts candidate skills and experience,
- builds embeddings and profile summaries,
- recommends matching jobs from the local database and external job sources,
- and keeps the UI readable and user-friendly.

## Current Highlights

- **Resume upload and parsing** for PDF, DOC, and DOCX files
- **Candidate profile enrichment** from uploaded CVs
- **Hybrid job search** combining internal jobs with external sources
- **USAJobs integration** enabled through environment configuration
- **Readable UI typography** tuned for clarity and accessibility

## Architecture

### Backend
- **FastAPI** for the API layer
- **SQLAlchemy** for database access
- **Pydantic** for request/response validation
- **JWT** for authentication
- **Sentence Transformers** for semantic embeddings
- **python-docx / PDF parsing** for resume extraction

### Frontend
- **React** for the user interface
- Candidate dashboard, job portal, applications view, and profile management

### External Job Sources
- Internal database jobs
- Adzuna
- USAJobs

## Features

### Candidate Experience
1. Create an account and sign in
2. Upload a resume/CV from the Candidate Profile page
3. Extract text, skills, education, and work history
4. Generate an embedding and profile summary
5. Refresh job recommendations automatically

### Job Search and Matching
- Semantic ranking of jobs against the candidate profile
- Unified results from internal and external sources
- Internal jobs are prioritized when available
- Graceful fallback if an external source is unavailable

## Technology Stack

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- MySQL / MariaDB
- Sentence Transformers
- scikit-learn
- python-docx

### Frontend
- React
- React Scripts
- CSS-based component styling

### Supporting Libraries
- PyPDF2 / PDF parsing utilities
- Bcrypt / Passlib for password hashing
- Requests for HTTP integration tests

## Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL or MariaDB
- `pip`
- `npm`

## Setup

### 1) Backend environment

Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install Python dependencies:

```powershell
pip install -r requirements.txt
```

### 2) Configure `.env`

Update `C:\Users\Simangaliso\Documents\ClonedProjects\Patice\MYPROJECT\.env` with your local values.

Required keys:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `UPLOAD_DIR`
- `MAX_FILE_SIZE`
- `EMBEDDING_MODEL`
- `SIMILARITY_THRESHOLD`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `USAJOBS_API_KEY`
- `USAJOBS_USER_EMAIL`
- `ENABLED_JOB_SOURCES`

Recommended values for hybrid search:

```dotenv
ENABLED_JOB_SOURCES=github,adzuna,usajobs
```

### 3) Database

Make sure your MySQL/MariaDB database exists and matches `DB_NAME`.

### 4) Run the backend

You can start the API with:

```powershell
python run.py
```

If you want to run the FastAPI app directly:

```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:

- `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 5) Run the frontend

In a separate terminal:

```powershell
cd frontend
npm install
npm start
```

The React app typically runs at `http://localhost:3000`.

## Verification

Quick checks after setup:

```powershell
python test_hybrid_search.py
python test_resume_upload.py
python debug_upload.py
```

Useful manual checks:

```powershell
python -c "import requests; print(requests.get('http://localhost:8000/openapi.json').status_code)"
python -c "import requests, json; r=requests.get('http://localhost:8000/api/v1/jobs/search/hybrid?query=python&include_external=true'); print(r.status_code); print(len(r.json().get('items', [])))"
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Register a new user
- `POST /api/v1/auth/login` — Login and get JWT tokens

### Candidate Profile
- `GET /api/v1/candidates/me` — Get current candidate profile
- `PUT /api/v1/candidates/me` — Update current candidate profile
- `GET /api/v1/candidates/me/matches` — Get AI job matches

### Resume Upload
- `POST /api/v1/uploads/resume` — Upload and parse a resume/CV

### Jobs
- `GET /api/v1/jobs` — List local jobs
- `GET /api/v1/jobs/search/hybrid` — Hybrid search across internal jobs and external sources

### Applications
- `POST /api/v1/candidates/me/applications` — Apply for a job
- `GET /api/v1/candidates/me/applications` — List my applications

## Resume Processing Flow

1. User uploads a resume from the Candidate Profile page
2. Backend validates file type and size
3. Resume text is extracted
4. Skills, education, and experience are parsed
5. Candidate embedding is generated
6. AI profile summary is generated
7. Job recommendations are refreshed

## Hybrid Job Search Flow

1. Search internal jobs in the database
2. Fetch external jobs from enabled providers
3. Normalize all results into one schema
4. Rank and combine results into a unified list
5. Return a single response to the frontend

## Project Structure

```text
MYPROJECT/
├── backend/
│   └── app/
│       ├── api/
│       ├── core/
│       ├── schemas/
│       ├── services/
│       ├── models.py
│       ├── database.py
│       ├── config.py
│       └── main.py
├── frontend/
│   ├── src/
│   └── package.json
├── uploads/
├── .env
├── requirements.txt
├── run.py
└── test_*.py
```

## Notes

- Keep secrets out of source control.
- External job sources are optional and controlled through `.env`.
- If an external API fails, the system still returns internal results.

## License

MIT License

## Support

For issues and questions, open an issue in the repository.

