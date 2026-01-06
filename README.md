# AI-Powered Job Recruitment System

An intelligent job recruitment platform that uses AI/ML to match candidates with job openings through semantic similarity and resume parsing.

## Features

### 🤖 AI/ML Components

1. **AI Resume Parser**
   - Extracts structured information from PDF and DOCX resumes
   - Identifies skills, experience, education, and contact information
   - Uses NLP techniques for intelligent text extraction

2. **Semantic Job Matching**
   - Uses Sentence Transformers (all-MiniLM-L6-v2) for semantic embeddings
   - Calculates cosine similarity between job descriptions and candidate profiles
   - Provides match scores and explanations for each candidate-job pair

3. **Automated Profile Analysis**
   - Generates AI-powered candidate profile summaries
   - Extracts key skills and experience levels
   - Creates vector embeddings for efficient matching

4. **Smart Recommendations**
   - Top-K job recommendations for candidates
   - Best candidate matches for each job posting
   - Personalized match explanations

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database management
- **MySQL** - Relational database
- **Pydantic** - Data validation

### AI/ML Libraries
- **Sentence Transformers** - Semantic text embeddings
- **scikit-learn** - Machine learning utilities
- **PyPDF2 & python-docx** - Document parsing
- **NLTK** - Natural language processing
- **PyTorch** - Deep learning framework

### Authentication & Security
- **JWT** - Token-based authentication
- **Passlib & Bcrypt** - Password hashing

## Installation

### Prerequisites
- Python 3.10+
- MySQL 5.7+ or MariaDB
- pip

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd MYPROJECT
```

2. **Create virtual environment**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and update:
- Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- JWT secret key (generate a secure random key)
- Other configuration as needed

5. **Create database**
```sql
CREATE DATABASE job_recruitment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

6. **Run the application**
```bash
python run.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Jobs (Recruiter/Admin)
- `POST /api/v1/jobs` - Create job posting
- `GET /api/v1/jobs` - List all jobs
- `GET /api/v1/jobs/{id}` - Get job details
- `PUT /api/v1/jobs/{id}` - Update job
- `DELETE /api/v1/jobs/{id}` - Delete job
- `GET /api/v1/jobs/my/jobs` - Get my job postings

### Candidates
- `GET /api/v1/candidates/me` - Get my profile
- `PUT /api/v1/candidates/me` - Update my profile
- `GET /api/v1/candidates/me/matches` - Get AI job matches
- `POST /api/v1/candidates/me/applications` - Apply for job
- `GET /api/v1/candidates/me/applications` - My applications

### Resume Upload
- `POST /api/v1/uploads/resume` - Upload and parse resume with AI

### AI Matching (Recruiter/Admin)
- `GET /api/v1/matches/job/{job_id}/candidates` - Get matching candidates for job
- `GET /api/v1/matches/applications/job/{job_id}` - Get job applications with scores
- `PUT /api/v1/matches/applications/{id}/status` - Update application status

## User Roles

1. **Candidate**
   - Create profile
   - Upload resume
   - Get AI-powered job recommendations
   - Apply for jobs
   - Track applications

2. **Recruiter**
   - Post jobs
   - View AI-matched candidates
   - Review applications with match scores
   - Update application status

3. **Admin**
   - All recruiter permissions
   - Manage all jobs and applications
   - System administration

## AI/ML Workflow

### Resume Processing
1. User uploads resume (PDF/DOCX)
2. AI parser extracts text and structured data
3. Skills, experience, and education identified
4. Semantic embedding generated using Sentence Transformers
5. Profile summary auto-generated

### Job Matching
1. Job posting created with description and requirements
2. Semantic embedding generated for job
3. When candidate applies or searches:
   - Cosine similarity calculated between embeddings
   - Skill overlap analyzed
   - Experience level matched
   - Combined score computed (0-1 range)
4. Match explanation generated
5. Results ranked by match score

## Project Structure

```
MYPROJECT/
├── backend/
│   └── app/
│       ├── api/           # API routes
│       │   ├── auth.py
│       │   ├── jobs.py
│       │   ├── candidates.py
│       │   ├── uploads.py
│       │   └── matches.py
│       ├── core/          # Core utilities
│       │   ├── security.py
│       │   └── dependencies.py
│       ├── services/      # AI/ML services
│       │   ├── resume_parser.py
│       │   ├── matching_engine.py
│       │   └── ai_service.py
│       ├── schemas/       # Pydantic schemas
│       ├── models.py      # Database models
│       ├── database.py    # Database setup
│       ├── config.py      # Configuration
│       └── main.py        # FastAPI app
├── uploads/               # Uploaded resumes
├── .env                   # Environment variables
├── requirements.txt       # Python dependencies
└── run.py                # Application runner
```

## Development

### Running Tests
```bash
pytest
```

### Code Quality
```bash
# Format code
black backend/

# Lint
flake8 backend/
```

## Production Deployment

1. Update `.env` with production settings
2. Use a production-grade WSGI server (e.g., Gunicorn)
3. Set up reverse proxy (Nginx)
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up database backups
7. Implement rate limiting
8. Add monitoring and logging

## Future Enhancements

- [ ] Interview scheduling
- [ ] Video interview integration
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Chat functionality
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Integration with LinkedIn/Indeed
- [ ] Advanced ML models (BERT, GPT)
- [ ] Skill gap analysis

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

