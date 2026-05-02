"""
Test RapidAPI Indeed Integration
"""
import os
import requests
from dotenv import load_dotenv

print("=" * 70)
print("TESTING RAPIDAPI INDEED INTEGRATION")
print("=" * 70)

# Load environment variables
load_dotenv()

RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST', 'jsearch.p.rapidapi.com')

print(f"\n📋 Configuration:")
print(f"   RapidAPI Key: {'✅ Found' if RAPIDAPI_KEY and RAPIDAPI_KEY != 'your_rapidapi_key_here' else '❌ Not Set'}")
print(f"   RapidAPI Host: {RAPIDAPI_HOST}")

if not RAPIDAPI_KEY or RAPIDAPI_KEY == 'your_rapidapi_key_here':
    print("\n❌ ERROR: RapidAPI Key not set!")
    print("\n📝 To fix:")
    print("   1. Go to https://rapidapi.com/hub")
    print("   2. Click your profile → 'My Apps'")
    print("   3. Copy your X-RapidAPI-Key")
    print("   4. Add it to .env file:")
    print("      RAPIDAPI_KEY=your_actual_key_here")
    exit(1)

print(f"\n🧪 Testing API Connection...")

headers = {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST
}

# Test request
url = f"https://{RAPIDAPI_HOST}/search"
params = {
    'query': 'software developer',
    'page': '1',
    'num_pages': '1'
}

try:
    print(f"\n📡 Sending request to {RAPIDAPI_HOST}...")
    response = requests.get(url, headers=headers, params=params, timeout=10)

    print(f"\n📊 Response:")
    print(f"   Status Code: {response.status_code}")

    if response.status_code == 200:
        print("\n✅ SUCCESS! API Key is working!")
        data = response.json()

        jobs = data.get('data', [])
        print(f"\n📋 Results:")
        print(f"   Jobs Found: {len(jobs)}")

        if jobs:
            print(f"\n🎯 Sample Jobs:")
            for i, job in enumerate(jobs[:3], 1):
                print(f"\n   {i}. {job.get('job_title', 'N/A')}")
                print(f"      Company: {job.get('employer_name', 'N/A')}")
                print(f"      Location: {job.get('job_city', 'N/A')}, {job.get('job_state', 'N/A')}")

        print("\n" + "=" * 70)
        print("✨ YOUR INDEED API IS READY TO USE! ✨")
        print("=" * 70)
        print("\n🚀 Next Steps:")
        print("   1. Your app will now fetch jobs from Indeed")
        print("   2. Start your backend: python run.py")
        print("   3. Search for jobs in your app")
        print("   4. You'll see Indeed jobs in the results!")

    elif response.status_code == 401:
        print("\n❌ AUTHENTICATION ERROR!")
        print("\n💡 Possible Issues:")
        print("   1. Invalid API Key")
        print("   2. API Key not copied correctly")
        print("   3. Extra spaces in the key")
        print("\n📝 To fix:")
        print("   - Go to https://rapidapi.com/hub")
        print("   - Click profile → 'My Apps'")
        print("   - Copy the FULL key (no spaces)")
        print("   - Update .env: RAPIDAPI_KEY=your_full_key")

    elif response.status_code == 403:
        print("\n❌ FORBIDDEN!")
        print("\n💡 Possible Issues:")
        print("   1. Not subscribed to the API")
        print("   2. Free tier limit exceeded")
        print("\n📝 To fix:")
        print("   - Check your RapidAPI subscription")
        print("   - Verify you're subscribed to the Indeed API")

    elif response.status_code == 429:
        print("\n⚠️  RATE LIMIT EXCEEDED!")
        print("\n💡 You've hit your free tier limit")
        print("   - Free tier: 250 requests/month")
        print("   - Wait until next month or upgrade")

    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(f"\n📄 Response: {response.text[:200]}")

except requests.exceptions.Timeout:
    print("\n⏱️  REQUEST TIMEOUT!")
    print("   The API took too long to respond")
    print("   Try again in a moment")

except requests.exceptions.ConnectionError:
    print("\n🌐 CONNECTION ERROR!")
    print("   Check your internet connection")

except Exception as e:
    print(f"\n❌ UNEXPECTED ERROR: {e}")
    print(f"\n📄 Details: {str(e)}")

print("\n" + "=" * 70)

