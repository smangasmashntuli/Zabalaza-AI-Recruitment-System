# 🧠 Gemini AI Integration Guide

This document explains the Gemini LLM integration for the AI-Powered Job Recruitment System. The Gemini integration adds the **"intelligence + personality layer"** on top of your existing resume parsing, embedding, and job matching capabilities.

## 🎯 What Gemini Does (Not Does)

### ✅ What Gemini DOES Add
1. **Human-readable match explanations** — "You're a strong fit because your React + Node experience aligns with 78% of required skills..."
2. **Career path intelligence** — "Based on your backend experience, you could transition into DevOps within 6 months by learning Docker and CI/CD pipelines."
3. **Smart job reasoning** — Semantic analysis beyond simple cosine similarity
4. **CV optimization suggestions** — Improve specific sections with ATS-friendly language
5. **Interview preparation tips** — Role-specific preparation guidance

### ❌ What Gemini Does NOT Replace
- ❌ Resume parsing (you already do this better with custom logic)
- ❌ Embedding generation (you use sentence-transformers)
- ❌ Job matching logic (you use cosine similarity + heuristics)

---

## 🚀 Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select your project or create a new one
4. Copy the API key

### 2. Add to `.env`

```dotenv
# Gemini LLM Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # or use gemini-pro for better quality
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
# or specifically:
pip install google-generativeai==0.4.0
```

---

## 📡 API Endpoints

### 1. **Get Job Matches with Explanations**

```http
GET /api/v1/candidates/me/matches
```

**Response:**
```json
{
  "items": [
    {
      "job_id": 1,
      "job_title": "Senior Python Developer",
      "match_score": 0.85,
      "match_explanation": "You're a strong fit because your 5+ years of Python and FastAPI experience align with 85% of required skills, and your database design expertise is valuable.",
      "skill_gaps": ["Kubernetes", "Docker"],
      "strengths": ["Python", "FastAPI", "PostgreSQL"],
      "job_details": { ... }
    }
  ],
  "insights": "The average match score for your top recommendations is 82%. Consider learning Kubernetes to improve matches.",
  "career_path": "Based on your backend experience, you could transition into DevOps within 6 months by learning Docker and CI/CD pipelines."
}
```

### 2. **Get Career Path Recommendations**

```http
GET /api/v1/candidates/me/career-path
```

**Response:**
```json
{
  "career_path": "As a mid-level backend developer with 4 years of experience, you're well-positioned to move into either a Senior Backend Engineer role (deepening expertise) or a Solutions Architect role (broader system thinking). I'd recommend focusing on microservices architecture and cloud platforms.",
  "learning_recommendations": [
    "Kubernetes/Docker (for Infrastructure)",
    "System Design (for Architecture)",
    "Go Lang (complementary backend)"
  ],
  "next_roles": ["Senior Backend Engineer", "Solutions Architect", "Technical Lead"]
}
```

### 3. **Get Interview Tips for a Job**

```http
POST /api/v1/candidates/me/interview-tips
Content-Type: application/json

{
  "job_id": 1
}
```

**Response:**
```json
{
  "interview_tips": "1. Be ready to discuss your FastAPI performance optimization work — they heavily use it. 2. Prepare examples of microservices challenges you've solved. 3. Study their tech stack (Kubernetes, PostgreSQL, Redis) and share relevant experience."
}
```

### 4. **Get CV Optimization Suggestions**

```http
POST /api/v1/candidates/me/cv-optimization
Content-Type: application/json

{
  "section": "summary"  // or "skills", "experience"
}
```

**Response:**
```json
{
  "optimized_text": "Results-driven backend engineer with 5+ years building scalable Python/FastAPI applications. Expert in microservices, database design, and DevOps. Delivered 3 major performance improvements averaging 40% latency reduction. Passionate about clean code and technical mentorship."
}
```

---

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│         User Request (job search, career path)     │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼────────────┐    ┌─────────▼──────────┐
    │  ResumeParser   │    │ MatchingEngine     │
    │  (extraction)   │    │ (embeddings/match) │
    └────────┬────────┘    └──────────┬────────┘
             │                        │
             │      Existing System   │
             │                        │
         ┌───┴────────────────────────┴─────┐
         │                                   │
    ┌────▼─────────────────────────────────────┐
    │  Match Score: 0.82                       │
    │  Candidate Skills: [Python, FastAPI]     │
    │  Required Skills: [Python, Flask, AWS]   │
    └────┬──────────────────────────────────────┘
         │
    ┌────▼─────────────────────────────────────┐
    │    GeminiService (LLM Intelligence)      │
    ├─────────────────────────────────────────┤
    │ - Generate match explanation            │
    │ - Extract skill gaps                    │
    │ - Explain career path                   │
    │ - Optimize CV sections                  │
    │ - Generate interview tips               │
    └──────────────────────────────────────────┘
         │
      ┌──▼─────────────────────────────┐
      │ "You're a strong fit because..." │
      │ Skill gaps: [AWS]                │
      │ Strengths: [Python, FastAPI]     │
      └─────────────────────────────────┘
```

### Code Flow

```python
# 1. User gets job matches
matches = ai_service.find_matching_jobs(
    candidate_embedding,
    jobs_dict,
    candidate_dict,
    top_k=10
)

# 2. For each match, generate explanation (Gemini)
for match in matches:
    explanation = ai_service.generate_match_explanation(
        job_data=job,
        candidate_data=candidate,
        match_score=match['match_score']
    )
    match['match_explanation'] = explanation

# 3. If matches are low, suggest career path (Gemini)
if avg_score < threshold:
    career_path = ai_service.generate_career_path(candidate_dict)
```

---

## 💡 Use Cases

### 1. **Candidate Sees Job Match**

**Before (without Gemini):**
```
Software Engineer – 85% match
```

**After (with Gemini):**
```
Software Engineer – 85% match
"You're a strong fit because your React + Node experience aligns with 78% of 
required skills, and your 3-year startup background shows entrepreneurial thinking 
that matches their innovation culture. You'll need to learn their internal tooling."

Skill Gaps: Docker, Kubernetes
Your Strengths: React, Node.js, API Design
```

### 2. **Low Match Score → Career Path**

**Scenario:** Candidate has 40% average match score

**Chat-like Interface:**
```
💬 Your matches are lower than ideal. Here's why:
   Your strong backend experience doesn't align with these frontend-heavy roles.
   
📚 Quick Learning Path (6 months):
   1. Learn React fundamentals (1 month)
   2. Build 2-3 portfolio projects (2 months)
   3. Practice system design for frontend (2 months)
   4. Apply to junior full-stack roles
   
🎯 Better Roles for Your Experience:
   - Backend Engineer (8+ matches)
   - DevOps Engineer (7+ matches)
   - Solutions Architect (6+ matches)
```

### 3. **Interview Preparation**

**User clicks "Prepare for Interview"** on a job posting:

```
🎤 Interview Preparation for: Senior Python Developer at Acme Corp

1. Be ready to discuss your FastAPI experience
   → They use FastAPI heavily. Prepare 2-3 architecture decisions you made.

2. Study their tech stack: PostgreSQL, Docker, GraphQL
   → You know SQL well. Mention your async ORM work.

3. Prepare for system design questions
   → They ask about scaling. Your payment processing project is perfect.

4. Question to ask them:
   "Can you walk me through a recent scaling challenge your team faced?"
```

---

## 🛠️ Configuration Options

### Model Selection

```dotenv
# For faster responses (free tier friendly)
GEMINI_MODEL=gemini-1.5-flash

# For higher quality (slower, requires paid tier)
GEMINI_MODEL=gemini-1.5-pro

# For text-only (legacy, but stable)
GEMINI_MODEL=gemini-1.0-pro
```

### Environment Variables

```dotenv
# Required
GEMINI_API_KEY=your_key_here

# Optional (defaults shown)
GEMINI_MODEL=gemini-1.5-flash
```

---

## 📊 Example: Complete Flow

### Step 1: User Uploads Resume

```python
@router.post("/uploads/resume")
def upload_resume(file: UploadFile):
    # ResumeParser extracts
    parsed = resume_parser.parse(file.content)
    # MatchingEngine generates embedding
    embedding = ai_service.generate_candidate_embedding(parsed)
    # Store candidate
```

### Step 2: User Views Job Matches

```python
@router.get("/candidates/me/matches")
def get_matches():
    # Find matches (cosine similarity)
    matches = ai_service.find_matching_jobs(...)
    
    # Enhance with Gemini
    for match in matches:
        # Gemini explains
        explanation = ai_service.generate_match_explanation(
            job_data=job,
            candidate_data=candidate,
            match_score=match['score']
        )
        match['explanation'] = explanation
    
    # Gemini career insights (if low scores)
    if avg_score < 0.6:
        career_path = ai_service.generate_career_path(candidate)
    
    return matches + career_path
```

### Step 3: User Clicks "Interview Tips"

```python
@router.post("/candidates/me/interview-tips")
def interview_tips(job_id: int):
    job = db.query(Job).get(job_id)
    candidate = get_current_candidate()
    
    tips = gemini_service.generate_interview_tips(
        job_title=job.title,
        job_description=job.description,
        candidate_experience=candidate.experience_summary
    )
    
    return {'tips': tips}
```

---

## 🎯 Fallbacks & Error Handling

The system gracefully handles Gemini failures:

```python
if gemini_service.enabled:
    try:
        explanation = gemini_service.generate_match_explanation(...)
    except Exception as e:
        # Fall back to heuristic
        explanation = _fallback_match_explanation(...)
else:
    # Gemini disabled (API key missing)
    explanation = _fallback_match_explanation(...)
```

**Fallback explanations** use heuristics:
- Matching skills count
- Experience level alignment
- Role similarity

---

## 📈 Performance & Cost

### API Limits (Free Tier)
- **Requests per minute:** 60 RPM
- **Requests per day:** 1,500 RDP
- **Tokens per minute:** 32,000 TPM

### Cost Estimation
- `gemini-1.5-flash` (recommended): **Free tier available**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

### Optimization Tips

1. **Cache results:**
   ```python
   # Cache match explanations for 1 hour
   cache.set(f"match_explanation_{job_id}_{candidate_id}", 
             explanation, timeout=3600)
   ```

2. **Batch requests:**
   - Generate multiple explanations in one prompt if possible

3. **Monitor usage:**
   - Log API calls to track rate limit consumption

---

## 🐛 Troubleshooting

### Issue: "API Key missing"
```python
# Check .env
print(settings.GEMINI_API_KEY)  # Should NOT be ""
```

### Issue: "Rate limit exceeded"
- Implement request queuing
- Use caching for explanations
- Upgrade to paid tier

### Issue: "Model not found"
```python
# Verify model name
GEMINI_MODEL=gemini-1.5-flash  ✅ Correct
GEMINI_MODEL=gemini-pro        ❌ Deprecated
```

### Issue: "Match explanations empty"
- Check debug logs: `logger.error(f"Error generating match explanation: {e}")`
- Verify input data (job_description, candidate_skills non-empty)
- Test Gemini API directly: `python -c "import google.generativeai; ..."`

---

## 🚀 Next Steps

### Frontend Integration
1. Display `match_explanation` in job card
2. Show `career_path` in insights section
3. Add "Interview Tips" button for each job

### Advanced Features (Future)
1. **Chat interface:**
   ```
   "Why am I not getting shortlisted?"
   "What skills should I learn?"
   "Rewrite my CV for Google"
   ```

2. **Salary negotiation coaching:**
   ```
   "Based on your experience, typical salaries for this role are..."
   "Here's how to negotiate..."
   ```

3. **Multi-language support:**
   ```python
   generate_match_explanation(..., language="Spanish")
   ```

---

## 📚 Reference

- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Gemini API Docs](https://ai.google.dev/docs)
- [google-generativeai Python SDK](https://github.com/google/generative-ai-python)

---

## 📝 Summary

The Gemini integration adds **intelligence + personality** to your recruitment system:

| Feature | Before | After |
|---------|--------|-------|
| Job matches | Score only | Score + explanation |
| Career guidance | None | AI-powered path |
| CV help | Manual | AI suggestions |
| Interviews | Self-research | Role-specific tips |

**Key Principle:** Gemini enhances, doesn't replace your core matching logic. ✨

---

*Last updated: May 2, 2026*

