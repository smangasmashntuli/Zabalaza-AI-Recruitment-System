# API Keys Configuration Guide

## 📍 Where to Add API Keys

**File Location:** `.env` (in the root of your project)

```
MYPROJECT/
├── .env  ← ADD YOUR API KEYS HERE
├── backend/
├── frontend/
└── ...
```

---

## 🔑 API Keys You Need

### 1. Job Aggregation Services

#### Indeed API
```env
INDEED_API_KEY=your_indeed_api_key_here
INDEED_PUBLISHER_ID=your_indeed_publisher_id_here
```
**How to get:**
1. Visit: https://ads.indeed.com/jobroll/signup
2. Sign up for an Indeed Publisher account
3. Get your Publisher ID and API key

#### Adzuna API
```env
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here
```
**How to get:**
1. Visit: https://developer.adzuna.com/signup
2. Create a developer account
3. Get your App ID and App Key

#### USAJobs API
```env
USAJOBS_API_KEY=your_usajobs_api_key_here
```
**How to get:**
1. Visit: https://developer.usajobs.gov/APIRequest/Index
2. Request an API key
3. Provide your email for authorization

#### GitHub Jobs
```env
GITHUB_TOKEN=your_github_personal_access_token_here
```
**How to get:**
1. Visit: https://github.com/settings/tokens
2. Generate a Personal Access Token
3. No special scopes needed for job API

---

### 2. AI Services (Optional - for enhanced features)

#### OpenAI API
```env
OPENAI_API_KEY=your_openai_api_key_here
```
**How to get:**
1. Visit: https://platform.openai.com/api-keys
2. Create an account
3. Generate an API key

#### Anthropic Claude
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
**How to get:**
1. Visit: https://console.anthropic.com/
2. Create an account
3. Generate an API key

---

### 3. Email Service (for notifications)

#### Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
```
**How to get:**
1. Enable 2-Step Verification on your Google account
2. Visit: https://myaccount.google.com/apppasswords
3. Generate an App Password (not your regular password!)

---

### 4. Payment Services (Optional)

#### Stripe
```env
STRIPE_API_KEY=your_stripe_api_key_here
```
**How to get:**
1. Visit: https://dashboard.stripe.com/register
2. Create an account
3. Get your API key from Dashboard → Developers → API keys

---

## 🚨 IMPORTANT SECURITY NOTES

### ✅ DO:
- Keep the `.env` file in your project root
- Add `.env` to `.gitignore` (already done!)
- Never commit API keys to version control
- Use different keys for development/production
- Rotate keys regularly

### ❌ DON'T:
- Share your `.env` file publicly
- Commit API keys to GitHub
- Hardcode keys in your code
- Use production keys in development

---

## 📝 How to Use Your Keys

After adding keys to `.env`, they're automatically loaded into your application:

**In Python (Backend):**
```python
import os
from dotenv import load_dotenv

load_dotenv()

indeed_key = os.getenv('INDEED_API_KEY')
```

**In JavaScript (Frontend - if needed):**
```javascript
// Only expose non-sensitive keys!
const apiUrl = process.env.REACT_APP_API_URL
```

---

## 🧪 Testing Your Keys

After adding your API keys, test them:

```bash
# Test Indeed API
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('INDEED_API_KEY'))"

# Test the hybrid job service
python test_hybrid_job_service.py
```

---

## 🔒 Example .env Structure

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=job_recruitment

# JWT Configuration
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256

# Job APIs
INDEED_API_KEY=abc123xyz789
ADZUNA_APP_ID=12345678
ADZUNA_APP_KEY=def456uvw101
USAJOBS_API_KEY=ghi789rst111

# AI Services
OPENAI_API_KEY=sk-proj-abc123...
```

---

## 🎯 Which Keys Do You NEED?

### Minimum (Free Tier):
- ✅ **GitHub Token** - Free, easy to get
- ✅ **Adzuna API** - Free tier available
- ⚠️ **USAJobs** - Free, requires approval

### Optional (Enhanced Features):
- 💰 **Indeed API** - Requires approval
- 💰 **OpenAI API** - Paid service
- 📧 **Gmail SMTP** - Free

### Can Wait:
- Stripe (only for payments)
- Twilio (only for SMS)

---

## 🚀 Quick Start

1. **Copy the template** (already in your .env)
2. **Get free API keys first** (GitHub, Adzuna)
3. **Replace placeholder values**
4. **Test your setup**
5. **Add more keys as needed**

---

## 📞 Support

If you need help getting API keys:
1. Check the official documentation links above
2. Most services have free tiers
3. Some require business verification
4. GitHub token is the easiest to start with

---

**Remember:** Never commit your actual API keys to version control! 🔒

---

*Last updated: January 25, 2026*

