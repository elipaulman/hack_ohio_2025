import requests
import pandas as pd

# -----------------------------
# 1️⃣ API endpoint and parameters
# -----------------------------
BASE_URL = "https://content.osu.edu/v2/classes/search"
params = {
    "q": "Scott",      # search for anything mentioning "Scott"
    "campus": "col"    # Columbus campus
}

print("🔍 Fetching classes mentioning 'Scott'...")

response = requests.get(BASE_URL, params=params)
data = response.json()

# -----------------------------
# 2️⃣ Extract meeting info
# -----------------------------
rooms = []

for course in data.get("data", {}).get("courses", []):
    for section in course.get("sections", []):
        for meeting in section.get("meetings", []):
            # Safely handle missing facilityDescription
            facility = meeting.get("facilityDescription") or ""
            if "Scott" in facility:
                # Convert day booleans into readable list
                days = [d for d, flag in {
                    "Mon": meeting.get("monday", False),
                    "Tue": meeting.get("tuesday", False),
                    "Wed": meeting.get("wednesday", False),
                    "Thu": meeting.get("thursday", False),
                    "Fri": meeting.get("friday", False)
                }.items() if flag]

                rooms.append({
                    "Course": section.get("courseTitle"),
                    "Instructor": ", ".join(i["displayName"] for i in section.get("instructors", [])),
                    "Room": f"{facility} {meeting.get('room') or ''}".strip(),
                    "Days": ", ".join(days),
                    "Start": meeting.get("startTime"),
                    "End": meeting.get("endTime"),
                    "Enrolled": section.get("enrollmentTotal"),
                    "Status": section.get("enrollmentStatus")
                })

# -----------------------------
# 3️⃣ Convert to DataFrame and save CSV
# -----------------------------
df = pd.DataFrame(rooms)

if not df.empty:
    print(f"✅ Found {len(df)} Scott Lab sections.")
    df.to_csv("scott_lab_schedule.csv", index=False)
    print("✅ Saved Scott Lab schedule to scott_lab_schedule.csv")
else:
    print("⚠️ No results found — try removing campus filters or checking term codes.")

# -----------------------------
# 4️⃣ Preview (optional)
# -----------------------------
print(df.head(30))
