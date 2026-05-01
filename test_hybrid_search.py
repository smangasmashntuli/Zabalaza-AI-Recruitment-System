#!/usr/bin/env python
import requests
import json

# Test the hybrid search endpoint
url = "http://localhost:8000/api/v1/jobs/search/hybrid?query=python&include_external=true"
response = requests.get(url)
data = response.json()

# Count jobs by source
sources = {}
for item in data.get('items', []):
    source = item['source']
    sources[source] = sources.get(source, 0) + 1

print("\n✓ HYBRID JOB SEARCH TEST PASSED")
print("=" * 50)
print(f"✓ Total jobs returned: {len(data.get('items', []))}")
print(f"✓ Sources found: {sorted(sources.keys())}")
print("\nJob count by source:")
for source in sorted(sources.keys()):
    print(f"  - {source}: {sources[source]} jobs")

# Check for source_status to see if external APIs were called
if 'source_status' in data:
    print("\nExternal API Status:")
    for source, status in data['source_status'].items():
        if status.get('success'):
            print(f"  ✓ {source}: SUCCESS ({status.get('count', 0)} jobs)")
        else:
            print(f"  ✗ {source}: FAILED - {status.get('error', 'Unknown error')}")

# Show sample USAJobs job if available
usajobs = [i for i in data.get('items', []) if i['source'] == 'usajobs']
if usajobs:
    print("\n✓ Sample USAJobs Result:")
    job = usajobs[0]
    print(f"  Title: {job.get('title', 'N/A')[:60]}")
    print(f"  Company: {job.get('company', 'N/A')}")
    print(f"  Location: {job.get('location', 'N/A')}")
    print(f"  Score: {job.get('score', 'N/A')}")
else:
    print("\n⚠ No USAJobs results returned")

# Show sample Adzuna job if available
adzuna = [i for i in data.get('items', []) if i['source'] == 'adzuna']
if adzuna:
    print("\n✓ Sample Adzuna Result:")
    job = adzuna[0]
    print(f"  Title: {job.get('title', 'N/A')[:60]}")
    print(f"  Company: {job.get('company', 'N/A')}")
    print(f"  Location: {job.get('location', 'N/A')}")
    print(f"  Score: {job.get('score', 'N/A')}")
else:
    print("\n⚠ No Adzuna results returned")

print("\n" + "=" * 50)

