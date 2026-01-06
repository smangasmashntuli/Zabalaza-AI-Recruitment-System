# Quick Start Guide

## 1. Database Setup

First, create the MySQL database:

```sql
CREATE DATABASE job_recruitment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Configure Environment

Edit the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=job_recruitment_db
```

## 3. Install Dependencies

Make sure you're in the virtual environment:

```bash
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## 4. Initialize Database

Run the database initialization script:

```bash
python init_db.py
```

## 5. Start the Server

```bash
python run.py
```

The server will start at `http://localhost:8000`

## 6. Access API Documentation

Open your browser and go to:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 7. Create Test Users

### Register a Candidate:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@test.com",
    "username": "candidate1",
    "password": "test123",
    "full_name": "Test Candidate",
    "role": "candidate"
  }'
```

### Register a Recruiter:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@test.com",
    "username": "recruiter1",
    "password": "test123",
    "full_name": "Test Recruiter",
    "role": "recruiter"
  }'
```

## 8. Test the API

Run the test script:

```bash
pip install requests
python test_api.py
```

## Common Workflows

### As a Candidate:
1. Register/Login
2. Upload resume (POST /api/v1/uploads/resume)
3. Get AI job matches (GET /api/v1/candidates/me/matches)
4. Apply for jobs (POST /api/v1/candidates/me/applications)
5. Track applications (GET /api/v1/candidates/me/applications)

### As a Recruiter:
1. Register/Login
2. Create job posting (POST /api/v1/jobs)
3. View matching candidates (GET /api/v1/matches/job/{job_id}/candidates)
4. Review applications (GET /api/v1/matches/applications/job/{job_id})
5. Update application status (PUT /api/v1/matches/applications/{id}/status)

## AI Features in Action

### Resume Parsing
When a candidate uploads a resume:
- Text extraction from PDF/DOCX
- Automatic skill detection
- Experience calculation
- Education extraction
- AI embedding generation

### Job Matching
The system automatically:
- Calculates semantic similarity
- Matches skills
- Considers experience level
- Generates match explanations
- Ranks candidates/jobs by relevance

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

### Module Not Found
- Activate virtual environment
- Run `pip install -r requirements.txt`

### Model Download Issues
The first run will download the sentence-transformers model (~90MB). This is normal and happens once.

## Next Steps

1. Customize the AI model in `config.py` (EMBEDDING_MODEL)
2. Add your own skill keywords in `resume_parser.py`
3. Adjust similarity threshold in `.env`
4. Implement additional features (email, notifications, etc.)

Enjoy your AI-powered recruitment system! 🚀

