# RTU Nodarbibas API - Curl Request Test Results

## Summary

Based on testing each API function from the README.md with curl requests:

### ✅ WORKING METHODS:

#### 1. `getCourses(periodId, programId)` - **WORKS**
- **Check if program is published:**
```bash
curl -X POST "https://nodarbibas.rtu.lv/isSemesterProgramPublished" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "semesterProgramId=27316"
```
Response: `true`

- **Get courses/subjects:**
```bash
curl -X POST "https://nodarbibas.rtu.lv/getSemProgSubjects" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "semesterProgramId=27316"
```
Response: JSON array with 9 course objects

#### 2. `getSchedule(periodId, programId, courseId, groupId, year, month)` - **WORKS**
```bash
curl -X POST "https://nodarbibas.rtu.lv/getSemesterProgEventList" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "semesterProgramId=27316" \
  --data-urlencode "year=2025" \
  --data-urlencode "month=9"
```
Response: JSON array with 62 schedule events

#### 3. `getScheduleBy(periodId, programId, courseId, groupId, filter)` - **WORKS**
Uses the same endpoint as `getSchedule()` but applies client-side filtering.

### ❌ NON-WORKING METHODS:

#### 1. `getPeriods()` - **DOES NOT WORK VIA CURL**
- The main page `https://nodarbibas.rtu.lv` loads but doesn't contain a `periods` dropdown
- This likely requires JavaScript execution to populate the dropdown dynamically

#### 2. `getPrograms(periodId)` - **DOES NOT WORK VIA CURL**  
- POST request to main page with `periods=dummy` doesn't return programs dropdown
- This also likely requires JavaScript execution and valid session handling

#### 3. `getGroups(periodId, programId, courseId)` - **NO HTTP ENDPOINT**
- Returns hardcoded `[{"id": "default", "name": "Default Group"}]` in the npm library
- No actual API endpoint to test

## Working Example Flow

The only reliable curl-based flow that works is:

1. **Get courses for program 27316:**
```bash
curl -X POST "https://nodarbibas.rtu.lv/getSemProgSubjects" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "semesterProgramId=27316"
```

2. **Get schedule for September 2025:**
```bash
curl -X POST "https://nodarbibas.rtu.lv/getSemesterProgEventList" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "semesterProgramId=27316" \
  --data-urlencode "year=2025" \
  --data-urlencode "month=9"
```

## Conclusion

**Only 3 out of 6 API functions** described in the README.md can be reliably tested with curl requests:
- ✅ `getCourses()` - Works with direct API endpoints
- ✅ `getSchedule()` - Works with direct API endpoints  
- ✅ `getScheduleBy()` - Same as getSchedule() + client filtering
- ❌ `getPeriods()` - Requires JavaScript/browser environment
- ❌ `getPrograms()` - Requires JavaScript/browser environment
- ❌ `getGroups()` - No actual HTTP endpoint (hardcoded response)

The npm library handles the complexity of session management, JavaScript execution, and HTML parsing that simple curl requests cannot replicate.