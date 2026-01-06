"""
Sample data seeder for testing the application
"""
from backend.app.database import SessionLocal
from backend.app.models import User, Job, Candidate, UserRole, JobStatus
from backend.app.core.security import get_password_hash
import json

def seed_data():
    """Seed the database with sample data"""
    db = SessionLocal()

    try:
        print("Seeding database with sample data...")

        # Create Admin User
        admin = User(
            email="admin@jobsystem.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)

        # Create Recruiter
        recruiter = User(
            email="recruiter@techcorp.com",
            username="recruiter1",
            hashed_password=get_password_hash("recruiter123"),
            full_name="Jane Recruiter",
            role=UserRole.RECRUITER,
            is_active=True
        )
        db.add(recruiter)

        # Create Candidate
        candidate_user = User(
            email="john.dev@email.com",
            username="johndev",
            hashed_password=get_password_hash("candidate123"),
            full_name="John Developer",
            role=UserRole.CANDIDATE,
            is_active=True
        )
        db.add(candidate_user)

        db.commit()
        db.refresh(recruiter)
        db.refresh(candidate_user)

        print("✓ Users created")

        # Create Candidate Profile
        candidate_profile = Candidate(
            user_id=candidate_user.id,
            phone="+1234567890",
            location="San Francisco, CA",
            experience_years=5.0,
            skills=json.dumps([
                "Python", "FastAPI", "React", "PostgreSQL",
                "Machine Learning", "Docker", "AWS"
            ]),
            education=json.dumps([
                {
                    "degree": "Bachelor's in Computer Science",
                    "institution": "Tech University",
                    "year": "2018"
                }
            ]),
            profile_summary="Senior software engineer with 5 years of experience in full-stack development and ML."
        )
        db.add(candidate_profile)

        print("✓ Candidate profile created")

        # Create Sample Jobs
        jobs_data = [
            {
                "title": "Senior Python Developer",
                "description": "We're seeking an experienced Python developer to join our backend team. You'll work on building scalable APIs and integrating ML models.",
                "requirements": "5+ years Python experience, FastAPI/Django, SQL databases, ML experience preferred",
                "location": "San Francisco, CA (Remote)",
                "salary_min": 120000,
                "salary_max": 160000,
                "job_type": "full-time",
                "experience_level": "senior",
                "skills": json.dumps(["Python", "FastAPI", "SQL", "Machine Learning", "Docker"])
            },
            {
                "title": "Full Stack Developer",
                "description": "Join our product team to build innovative web applications using modern technologies.",
                "requirements": "3+ years experience, React, Node.js, PostgreSQL, AWS knowledge",
                "location": "New York, NY (Hybrid)",
                "salary_min": 90000,
                "salary_max": 130000,
                "job_type": "full-time",
                "experience_level": "mid",
                "skills": json.dumps(["React", "Node.js", "PostgreSQL", "AWS", "JavaScript"])
            },
            {
                "title": "Machine Learning Engineer",
                "description": "Help us build cutting-edge ML models for our AI-powered platform.",
                "requirements": "4+ years ML experience, Python, TensorFlow/PyTorch, NLP, Computer Vision",
                "location": "Remote",
                "salary_min": 130000,
                "salary_max": 180000,
                "job_type": "full-time",
                "experience_level": "senior",
                "skills": json.dumps(["Python", "Machine Learning", "TensorFlow", "PyTorch", "NLP"])
            },
            {
                "title": "Junior Frontend Developer",
                "description": "Great opportunity for early-career developers to work on exciting projects.",
                "requirements": "1-2 years experience, React, JavaScript, HTML/CSS",
                "location": "Austin, TX",
                "salary_min": 60000,
                "salary_max": 80000,
                "job_type": "full-time",
                "experience_level": "entry",
                "skills": json.dumps(["React", "JavaScript", "HTML", "CSS"])
            },
            {
                "title": "DevOps Engineer",
                "description": "Manage our cloud infrastructure and CI/CD pipelines.",
                "requirements": "3+ years DevOps, AWS/Azure, Docker, Kubernetes, Terraform",
                "location": "Remote",
                "salary_min": 100000,
                "salary_max": 140000,
                "job_type": "full-time",
                "experience_level": "mid",
                "skills": json.dumps(["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"])
            }
        ]

        for job_data in jobs_data:
            job = Job(
                **job_data,
                recruiter_id=recruiter.id,
                status=JobStatus.ACTIVE
            )
            db.add(job)

        db.commit()
        print("✓ Sample jobs created")

        print("\n✅ Database seeded successfully!")
        print("\nTest Accounts:")
        print("  Admin:     admin / admin123")
        print("  Recruiter: recruiter1 / recruiter123")
        print("  Candidate: johndev / candidate123")
        print("\nYou can now login and test the system!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

