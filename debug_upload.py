from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

login = client.post(
    "/api/v1/auth/login",
    data={"username": "resumetest", "password": "TestPassword123!"},
)
print("login", login.status_code, login.text)

token = login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

with open("test_resume.docx", "rb") as f:
    files = {
        "file": (
            "resume.docx",
            f,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    try:
        response = client.post("/api/v1/uploads/resume", headers=headers, files=files)
        print("upload", response.status_code)
        print(response.text)
    except Exception as exc:
        import traceback

        traceback.print_exc()
        raise

