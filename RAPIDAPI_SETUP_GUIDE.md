# 🔑 RapidAPI Indeed Integration - Complete Guide

## ✅ Current Status

Great! You've subscribed to Indeed API on RapidAPI. Here's how to complete the setup.

---

## 📍 Step-by-Step: Get Your RapidAPI Key

### 1. **Find Your RapidAPI Key**

1. Go to: https://rapidapi.com/hub
2. Click on your profile (top right)
3. Select **"My Apps"** or **"Default Application"**
4. You'll see: **"X-RapidAPI-Key"** - This is your key!
5. Click **"Copy"** to copy the key

### 2. **Add the Key to Your `.env` File**

Replace this line in your `.env`:
```env
RAPIDAPI_KEY=your_rapidapi_key_here
```

With your actual key:
```env
RAPIDAPI_KEY=1234567890abcdef1234567890abcdef1234567890
```

**Example of what it looks like:**
```env
RAPIDAPI_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

## 🎯 Which Indeed API Did You Subscribe To?

RapidAPI has **multiple Indeed APIs**. The most common ones are:

### Option 1: **JSearch API** (Recommended)
- URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
- Host: `jsearch.p.rapidapi.com`
- Free tier: 250 requests/month

### Option 2: **Indeed12 API**
- URL: https://rapidapi.com/apiheya/api/indeed12
- Host: `indeed12.p.rapidapi.com`
- Free tier: 100 requests/month

### Option 3: **Indeed Jobs Search API**
- Various providers available

---

## 🔧 Update Your Configuration

### If you're using **JSearch API** (default):

Your `.env` should have:
```env
RAPIDAPI_KEY=your_actual_key_from_rapidapi
RAPIDAPI_HOST=jsearch.p.rapidapi.com
```

### If you're using **Indeed12 API**:

Your `.env` should have:
```env
RAPIDAPI_KEY=your_actual_key_from_rapidapi
RAPIDAPI_HOST=indeed12.p.rapidapi.com
```

---

## ✅ Complete `.env` Configuration Example

Here's how your `.env` file should look after adding your key:

```env
# Job Aggregation Services

# Indeed via RapidAPI
RAPIDAPI_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6  # ← Your actual key here
RAPIDAPI_HOST=jsearch.p.rapidapi.com            # ← Correct host
INDEED_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6  # ← Same as RAPIDAPI_KEY

# Adzuna API
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here

# USAJobs API
USAJOBS_API_KEY=your_usajobs_api_key_here

# GitHub Jobs
GITHUB_TOKEN=your_github_token_here  # ← Add your GitHub token here
```

---

## 🧪 Test Your RapidAPI Key

After adding your key, test it with this Python script:

```python
# test_rapidapi.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST', 'jsearch.p.rapidapi.com')

headers = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
}

# Test request
url = f"https://{RAPIDAPI_HOST}/search"
params = {
    'query': 'python developer',
    'page': '1',
    'num_pages': '1'
}

try:
    response = requests.get(url, headers=headers, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ API Key is working!")
        data = response.json()
        print(f"Found {len(data.get('data', []))} jobs")
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
```

Run it:
```bash
python test_rapidapi.py
```

---

## 📊 What Happens After Setup

Once you add your RapidAPI key:

1. **Hybrid Job Service** will automatically use it
2. When users search for jobs, your app will:
   - Search your internal database
   - **Also search Indeed** via RapidAPI
   - **Also search GitHub** Jobs
   - Combine all results
   - Show users a unified job list

3. **API Rate Limits** (Free Tier):
   - JSearch: 250 requests/month
   - That's about 8 requests/day
   - Each request returns ~10-20 jobs

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid API Key"
**Solution:** 
- Make sure you copied the FULL key
- Check for extra spaces before/after
- Verify you're using the correct host

### Issue 2: "Rate limit exceeded"
**Solution:**
- You've hit your free tier limit
- Upgrade plan on RapidAPI
- Or wait until next month

### Issue 3: "Wrong host"
**Solution:**
- Check which Indeed API you subscribed to
- Update `RAPIDAPI_HOST` to match
- Common hosts:
  - `jsearch.p.rapidapi.com`
  - `indeed12.p.rapidapi.com`

---

## 🎯 Quick Action Checklist

- [ ] Go to RapidAPI.com
- [ ] Click your profile → "My Apps"
- [ ] Copy your X-RapidAPI-Key
- [ ] Open `.env` file
- [ ] Replace `your_rapidapi_key_here` with your actual key
- [ ] Replace `INDEED_API_KEY` with the same key
- [ ] Save the file
- [ ] Test with `python test_rapidapi.py`
- [ ] Restart your backend server

---

## 📞 Need Help?

**Finding Your Key:**
1. Login to https://rapidapi.com
2. Click your avatar (top right)
3. Select "My Apps"
4. Copy the key shown

**Which API to use:**
- **Recommended:** JSearch API (best free tier)
- URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch

---

## ✨ You're Almost There!

Just 3 simple steps:
1. Copy your RapidAPI key
2. Paste it in `.env` as `RAPIDAPI_KEY=your_key_here`
3. Save and restart your server

That's it! Your app will now fetch jobs from Indeed! 🎉

---

*Last updated: January 25, 2026*

