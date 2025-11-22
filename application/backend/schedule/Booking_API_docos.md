# API Documentation - Booking System

## Overview
The Booking System API allows users to check tutor availability, create bookings, and manage scheduled sessions.

## Base URL
`http://127.0.0.1:8000` (Local) or Production URL

---

## Endpoints

### 1. Check Tutor Availability
Get available time slots for a specific tutor on a given date.

- **Endpoint:** `GET /search/tutors/{tutor_id}/availability`
- **Query Params:**
  - `date` (required): YYYY-MM-DD format (e.g., `2024-11-25`)

**Example Request:**
```bash
curl "http://127.0.0.1:8000/search/tutors/7/availability?date=2024-11-25"
```

**Response:**
```json
{
  "tutor_id": 7,
  "date": "2024-11-25",
  "slots": [
    {
      "start_time": "2024-11-25T10:00:00",
      "end_time": "2024-11-25T11:00:00",
      "is_available": true
    }
  ]
}
```

---

### 2. Create a Booking
Book a session with a tutor.

- **Endpoint:** `POST /search/bookings`
- **Body:** JSON object

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/search/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tutor_id": 7,
    "student_id": 1,
    "start_time": "2024-11-25T10:00:00",
    "end_time": "2024-11-25T11:00:00",
    "course_id": 1,
    "meeting_link": "https://zoom.us/j/123456",
    "notes": "I need help with Python recursion."
  }'
```

**Response:**
```json
{
  "booking_id": 10,
  "tutor_id": 7,
  "student_id": 1,
  "status": "confirmed",
  "start_time": "2024-11-25T10:00:00",
  "end_time": "2024-11-25T11:00:00",
  "course_id": 1,
  "meeting_link": "https://zoom.us/j/123456",
  "notes": "I need help with Python recursion.",
  "created_at": "2024-11-22T10:00:00"
}
```

**Errors:**
- `400 Bad Request`: "This time slot is already booked."

---

### 3. Get Bookings (Unified Search)
Retrieve bookings filtered by student or tutor.

- **Endpoint:** `GET /search/bookings`
- **Query Params:**
  - `student_id` (optional): ID of the student
  - `tutor_id` (optional): ID of the tutor

**Example 1: Get Student Bookings**
```bash
curl "http://127.0.0.1:8000/search/bookings?student_id=1"
```

**Example 2: Get Tutor Bookings**
```bash
curl "http://127.0.0.1:8000/search/bookings?tutor_id=7"
```

**Response:**
```json
[
  {
    "booking_id": 10,
    "tutor_id": 7,
    "student_id": 1,
    "start_time": "...",
    "end_time": "...",
    "status": "confirmed",
    "course_id": 1,
    "meeting_link": "https://zoom.us/j/123456",
    "tutor_name": "Claudia Ramirez",
    "student_name": "Sarah Cho",
    "course_title": "Intro to Python"
  }
]
```

---

## Integration Notes for Frontend

1.  **Availability Check First:** Always call the availability endpoint before allowing a user to select a time. This ensures they don't pick an already booked slot.
2.  **Timezones:** The API expects and returns ISO 8601 datetime strings. Ensure you handle timezone conversion if necessary (currently assumes local server time or UTC depending on DB config).
3.  **Error Handling:** Handle 400 errors gracefully when booking fails due to a race condition (someone else booked it just before).
