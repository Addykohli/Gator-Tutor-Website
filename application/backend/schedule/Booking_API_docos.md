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
Book a session with a tutor. Creates a booking request that requires tutor approval before confirmation.

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
  "status": "pending",
  "start_time": "2024-11-25T10:00:00",
  "end_time": "2024-11-25T11:00:00",
  "course_id": 1,
  "meeting_link": "https://zoom.us/j/123456",
  "notes": "I need help with Python recursion.",
  "created_at": "2024-11-22T10:00:00"
}
```

**Notes:**
- New bookings are created with `status: "pending"` by default, requiring tutor approval before the session is confirmed.
- The time slot becomes unavailable immediately upon booking creation (even while pending) to prevent double-booking.

**Errors:**
- `400 Bad Request`: "This time slot is already booked."

---

### 3. Get Bookings (Unified Search)
Retrieve bookings filtered by student, tutor, and/or status. Useful for viewing all bookings, pending requests, or confirmed sessions.

- **Endpoint:** `GET /search/bookings`
- **Query Params:**
  - `student_id` (optional): ID of the student
  - `tutor_id` (optional): ID of the tutor
  - `status` (optional): Filter by booking status (`pending`, `confirmed`, `cancelled`, `completed`)

**Example 1: Get Student Bookings**
```bash
curl "http://127.0.0.1:8000/search/bookings?student_id=1"
```

**Example 2: Get Tutor Bookings**
```bash
curl "http://127.0.0.1:8000/search/bookings?tutor_id=7"
```

**Example 3: Get Pending Requests for Tutor**
```bash
curl "http://127.0.0.1:8000/search/bookings?tutor_id=7&status=pending"
```

**Response:**
```json
[
  {
    "booking_id": 10,
    "tutor_id": 7,
    "student_id": 1,
    "start_time": "2024-11-25T10:00:00",
    "end_time": "2024-11-25T11:00:00",
    "status": "pending",
    "course_id": 1,
    "meeting_link": "https://zoom.us/j/123456",
    "tutor_name": "Claudia Ramirez",
    "student_name": "Sarah Cho",
    "course_title": "Intro to Python",
    "created_at": "2024-11-22T10:00:00"
  }
]
```

**Notes:**
- Use `status=pending` to fetch booking requests awaiting tutor approval for the tutor's dashboard.
- Combine filters to get specific views (e.g., `tutor_id=7&status=confirmed` for confirmed upcoming sessions).

---

### 4. Update Booking Status
Approve or reject a booking request. Only the tutor associated with the booking can update its status.

- **Endpoint:** `PUT /search/bookings/{booking_id}/status`
- **Path Params:**
  - `booking_id` (required): ID of the booking to update
- **Body:** JSON object

**Example Request: Approve Booking**
```bash
curl -X PUT http://127.0.0.1:8000/search/bookings/10/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "tutor_id": 7
  }'
```

**Example Request: Reject Booking**
```bash
curl -X PUT http://127.0.0.1:8000/search/bookings/10/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled",
    "tutor_id": 7
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
  "tutor_name": "Claudia Ramirez",
  "student_name": "Sarah Cho",
  "course_title": "Intro to Python",
  "created_at": "2024-11-22T10:00:00"
}
```

**Valid Status Values:**
- `pending`: Booking request awaiting approval
- `confirmed`: Booking approved by tutor
- `cancelled`: Booking rejected or cancelled
- `completed`: Session has been completed

**Notes:**
- Tutors use this endpoint to approve (`confirmed`) or reject (`cancelled`) booking requests from students.
- When a booking is cancelled, the time slot becomes available again for other students to book.
- Only the tutor whose `tutor_id` matches the booking can update its status (authorization check).

**Errors:**
- `400 Bad Request`: "Invalid status. Must be one of: pending, confirmed, cancelled, completed"
- `400 Bad Request`: "Booking with ID {id} not found"
- `400 Bad Request`: "Only the tutor associated with this booking can update its status"

---

## Booking Status Workflow

1. **Student Creates Booking**: `POST /search/bookings` → Creates booking with `status: "pending"`
2. **Tutor Views Requests**: `GET /search/bookings?tutor_id=X&status=pending` → Shows all pending requests
3. **Tutor Approves/Rejects**: `PUT /search/bookings/{id}/status` → Updates status to `confirmed` or `cancelled`
4. **Slot Availability**: Pending and confirmed bookings both block availability; cancelled bookings free the slot

---

## Integration Notes for Frontend

1.  **Availability Check First:** Always call the availability endpoint before allowing a user to select a time. This ensures they don't pick an already booked slot (pending bookings are also excluded from availability).
2.  **Booking Approval Flow:** After a student creates a booking, it starts as `pending`. Tutors should fetch pending requests using `GET /search/bookings?tutor_id=X&status=pending` and use the status update endpoint to approve or reject them.
3.  **Timezones:** The API expects and returns ISO 8601 datetime strings. Ensure you handle timezone conversion if necessary (currently assumes local server time or UTC depending on DB config).
4.  **Error Handling:** Handle 400 errors gracefully when booking fails due to a race condition (someone else booked it just before) or when status updates fail due to authorization issues.
5.  **Status Display:** Show appropriate UI indicators for booking status - "Pending Approval" for pending bookings, "Confirmed" for approved sessions, and handle cancelled bookings appropriately.
