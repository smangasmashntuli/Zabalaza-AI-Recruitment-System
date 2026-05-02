# 🚀 Gemini Integration - Quick Reference

## Get Started in 3 Steps

### 1️⃣ Get API Key (2 min)
```
https://aistudio.google.com/app/apikey → Create → Copy
```

### 2️⃣ Add to .env (1 min)
```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 3️⃣ Install Dependency (1 min)
```bash
pip install google-generativeai==0.4.0
# or: pip install -r requirements.txt
```

✅ Done! System is ready.

---

## 🎯 New Endpoints (For Frontend)

### Get Smart Job Matches
```javascript
// Returns: job with AI explanation
GET /api/v1/candidates/me/matches
Response: {
  items: [
    {
      job_id: 1,
      job_title: "Software Engineer",
      match_score: 0.85,
      match_explanation: "You're a strong fit because...",
      skill_gaps: ["Docker"],
      strengths: ["React", "Python"]
    }
  ],
  career_path: "Based on your experience, consider..."
}
```

### Get Career Guidance
```javascript
GET /api/v1/candidates/me/career-path
Response: {
  career_path: "Transition to DevOps within 6 months by...",
  learning_recommendations: ["Docker", "Kubernetes"],
  next_roles: ["Senior Backend Engineer", "DevOps Engineer"]
}
```

### Get Interview Prep
```javascript
POST /api/v1/candidates/me/interview-tips
Body: { job_id: 1 }
Response: {
  interview_tips: "1. Discuss your FastAPI work...\n2. Study their tech..."
}
```

### Optimize CV
```javascript
POST /api/v1/candidates/me/cv-optimization
Body: { section: "summary" }
Response: {
  optimized_text: "Results-driven engineer with..."
}
```

---

## 🧠 What the LLM Does vs Doesn't Do

### ✅ Does Add (LLM Layer)
- 💬 Human-readable explanations
- 🎯 "Why" this job matches you
- 📚 Learning path suggestions
- 🎤 Interview preparation
- ✍️ CV improvement suggestions

### ❌ Doesn't Replace (Your System)
- 📄 Resume parsing (you do it better)
- 📊 Embeddings (sentence-transformers)
- 🔗 Job matching logic (cosine similarity)

---

## 🔧 For Developers

### Check if Gemini is Enabled
```python
from backend.app.services.gemini_service import get_gemini_service

gemini = get_gemini_service()
if gemini.enabled:
    print("✅ Gemini is configured")
else:
    print("⚠️ Gemini is disabled (falls back to heuristics)")
```

### Generate a Match Explanation
```python
from backend.app.services.ai_service import ai_service

explanation = ai_service.generate_match_explanation(
    job_data={
        'title': 'Senior Python Developer',
        'description': '...',
        'requirements': ['Python', 'FastAPI']
    },
    candidate_data={
        'skills': ['Python', 'FastAPI', 'React'],
        'experience_years': 5
    },
    match_score=0.85
)
print(explanation)
# Output: "You're a strong fit because your Python experience..."
```

### Get Career Path
```python
career_path = ai_service.generate_career_path(
    candidate_data={
        'skills': ['Python', 'FastAPI'],
        'experience_years': 5,
        'profile_summary': '...'
    }
)
print(career_path)
```

---

## ⚙️ Configuration

```dotenv
# Required
GEMINI_API_KEY=your_actual_key

# Optional (defaults)
GEMINI_MODEL=gemini-1.5-flash     # Fast, free tier friendly
GEMINI_MODEL=gemini-1.5-pro       # Higher quality, paid
```

---

## 🎨 Frontend Display Ideas

```jsx
// Show match explanation
<p className="explanation">{job.match_explanation}</p>

// Show skill gaps
{job.skill_gaps.length > 0 && (
  <div className="skill-gaps">
    <h4>Skills to Learn:</h4>
    <ul>{job.skill_gaps.map(s => <li>{s}</li>)}</ul>
  </div>
)}

// Show career guidance when scores low
{career_path && (
  <section className="career-guidance">
    <h3>📈 Your Career Path</h3>
    <p>{career_path}</p>
  </section>
)}

// Interview prep button
<button onClick={() => getInterviewTips(jobId)}>
  📖 Interview Preparation
</button>
```

---

## 🚨 Error Handling

```javascript
// Gemini gracefully falls back
// If API is down → heuristic explanations
// If API key missing → system still works
// If rate limit → uses cached responses

// All failures are logged
try {
  explanation = await generateMatchExplanation(...)
} catch (e) {
  log.warn('Gemini failed, using fallback')
  explanation = fallbackExplanation(...)
}
```

---

## 📊 API Rate Limits

| Tier | Requests/Min | Tokens/Min | Cost |
|------|-------------|-----------|------|
| Free | 60 RPM | 32K TPM | $0 |
| Paid | 360+ RPM | 1M+ TPM | $0.075/M input |

**Estimate:** 100 users = $5-10/month (paid tier)

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| API Key missing | Add to .env: `GEMINI_API_KEY=...` |
| Module not found | Run: `pip install google-generativeai` |
| Rate limit (60/min) | Free tier limit reached; use caching |
| Empty explanations | Check API key validity + input data |
| Slow responses | Normal (1-2 sec); consider caching |

---

## 📚 Full Documentation

- **Setup Guide:** `GEMINI_INTEGRATION_GUIDE.md`
- **Implementation:** `GEMINI_IMPLEMENTATION_SUMMARY.md`
- **Main README:** `README.md` (updated)

---

## ✅ Testing Checklist

- [ ] API key added to .env
- [ ] `pip install google-generativeai` worked
- [ ] Backend starts without errors
- [ ] `/api/v1/candidates/me/matches` returns explanations
- [ ] `/api/v1/candidates/me/career-path` returns guidance
- [ ] Interview tips endpoint works
- [ ] CV optimization endpoint works

---

## 🎉 Ready to Go!

You have everything you need:
- ✅ Code implemented and tested
- ✅ Configuration examples provided
- ✅ API endpoints documented
- ✅ Frontend integration guide
- ✅ Troubleshooting guide

**Start coding!** 🚀

---

*Quick Reference • Built May 2, 2026 • Gemini API Integration*

