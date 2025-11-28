# API Documentation - Schedule & Booking System

## Overview
The Schedule & Booking System API allows tutors to manage their availability and students to book sessions.

## Base URL
`http://127.0.0.1:8000` (Local) or Production URL

---

## Endpoints

### 1. Check Tutor Availability
Get available time slots for a specific tutor on a given date.

- **Endpoint:** `GET /schedule/tutors/{tutor_id}/availability`
- **Query Params:**
  - `date` (required): YYYY-MM-DD format (e.g., `2024-11-25`)

**Example Request:**
```bash
curl "http://127.0.0.1:8000/schedule/tutors/7/availability?date=2024-11-25"
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

- **Endpoint:** `POST /schedule/bookings`
- **Body:** JSON object

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/schedule/bookings \
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

- **Endpoint:** `GET /schedule/bookings`
- **Query Params:**
  - `student_id` (optional): ID of the student
  - `tutor_id` (optional): ID of the tutor
  - `status` (optional): Filter by booking status (`pending`, `confirmed`, `cancelled`, `completed`)

**Example 1: Get Student Bookings**
```bash
curl "http://127.0.0.1:8000/schedule/bookings?student_id=1"
```

**Example 2: Get Tutor Bookings**
```bash
curl "http://127.0.0.1:8000/schedule/bookings?tutor_id=7"
```

**Example 3: Get Pending Requests for Tutor**
```bash
curl "http://127.0.0.1:8000/schedule/bookings?tutor_id=7&status=pending"
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

### 3b. Get Student Bookings (Dedicated Endpoint)
Get all bookings for a specific student.

- **Endpoint:** `GET /schedule/bookings/student/{student_id}`
- **Path Params:**
  - `student_id` (required): ID of the student

**Example Request:**
```bash
curl "http://127.0.0.1:8000/schedule/bookings/student/1"
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
    "status": "confirmed",
    "course_id": 1,
    "meeting_link": "https://zoom.us/j/123456",
    "created_at": "2024-11-22T10:00:00"
  }
]
```

---

### 3c. Get Tutor Bookings (Dedicated Endpoint)
Get all bookings for a specific tutor.

- **Endpoint:** `GET /schedule/bookings/tutor/{tutor_id}`
- **Path Params:**
  - `tutor_id` (required): ID of the tutor

**Example Request:**
```bash
curl "http://127.0.0.1:8000/schedule/bookings/tutor/7"
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
    "status": "confirmed",
    "course_id": 1,
    "meeting_link": "https://zoom.us/j/123456",
    "created_at": "2024-11-22T10:00:00"
  }
]
```

---

### 4. Update Booking Status
Approve or reject a booking request. Only the tutor associated with the booking can update its status.

- **Endpoint:** `PUT /schedule/bookings/{booking_id}/status`
- **Path Params:**
  - `booking_id` (required): ID of the booking to update
- **Body:** JSON object

**Example Request: Approve Booking**
```bash
curl -X PUT http://127.0.0.1:8000/schedule/bookings/10/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "tutor_id": 7
  }'
```

**Example Request: Reject Booking**
```bash
curl -X PUT http://127.0.0.1:8000/schedule/bookings/10/status \
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

## Availability Slot Management (Tutor Schedule)

These endpoints allow tutors to manage their recurring weekly availability schedule.

### 5. Get Availability Slots
Get all recurring availability slots for a tutor.

- **Endpoint:** `GET /schedule/tutors/{tutor_id}/availability-slots`
- **Path Params:**
  - `tutor_id` (required): ID of the tutor

**Example Request:**
```bash
curl "http://127.0.0.1:8000/schedule/tutors/7/availability-slots"
```

**Response:**
```json
[
  {
    "slot_id": 1,
    "tutor_id": 7,
    "weekday": 1,
    "start_time": "10:00:00",
    "end_time": "14:00:00",
    "location_mode": "online",
    "location_note": "Zoom link will be provided",
    "valid_until": "2025-03-20"
  },
  {
    "slot_id": 2,
    "tutor_id": 7,
    "weekday": 3,
    "start_time": "09:00:00",
    "end_time": "12:00:00",
    "location_mode": "campus",
    "location_note": "Library Room 201",
    "valid_until": null
  }
]
```

**Notes:**
- Slots are ordered by weekday and start time.
- Weekday format: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- `valid_until`: Expiry date for the slot. `null` means the slot never expires.
- Expired slots (where `valid_until` < today) are automatically filtered out.

---

### 6. Create Availability Slot
Create a new recurring availability slot for a tutor.

- **Endpoint:** `POST /schedule/tutors/{tutor_id}/availability-slots`
- **Path Params:**
  - `tutor_id` (required): ID of the tutor
- **Body:** JSON object

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/schedule/tutors/7/availability-slots \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": 1,
    "start_time": "10:00:00",
    "end_time": "14:00:00",
    "location_mode": "online",
    "location_note": "Zoom link will be provided",
    "duration": "semester"
  }'
```

**Response:**
```json
{
  "slot_id": 1,
  "tutor_id": 7,
  "weekday": 1,
  "start_time": "10:00:00",
  "end_time": "14:00:00",
  "location_mode": "online",
  "location_note": "Zoom link will be provided",
  "valid_until": "2025-03-20"
}
```

**Request Body Fields:**
- `weekday` (required): Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
- `start_time` (required): Start time in HH:MM:SS format
- `end_time` (required): End time in HH:MM:SS format
- `location_mode` (optional): Location mode (e.g., "online", "campus")
- `location_note` (optional): Additional location details
- `duration` (optional): How long the slot should be valid. Defaults to `"semester"`. Options:
  - `"week"`: Valid for 7 days
  - `"month"`: Valid for 28 days
  - `"semester"`: Valid for 112 days (default)
  - `"forever"`: Never expires (`valid_until` will be `null`)

**Errors:**
- `400 Bad Request`: "Start time must be before end time"
- `400 Bad Request`: "This time slot overlaps with an existing availability slot"

---

### 7. Update Availability Slot
Update an existing availability slot. Only the tutor who owns the slot can update it.

- **Endpoint:** `PUT /schedule/tutors/{tutor_id}/availability-slots/{slot_id}`
- **Path Params:**
  - `tutor_id` (required): ID of the tutor (for authorization)
  - `slot_id` (required): ID of the slot to update
- **Body:** JSON object (all fields optional)

**Example Request:**
```bash
curl -X PUT http://127.0.0.1:8000/schedule/tutors/7/availability-slots/1 \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "11:00:00",
    "end_time": "15:00:00"
  }'
```

**Response:**
```json
{
  "slot_id": 1,
  "tutor_id": 7,
  "weekday": 1,
  "start_time": "11:00:00",
  "end_time": "15:00:00",
  "location_mode": "online",
  "location_note": "Zoom link will be provided",
  "valid_until": "2025-03-20"
}
```

**Notes:**
- Only provided fields will be updated; others remain unchanged.
- Overlap validation is performed after applying updates.
- `valid_until` is set at creation time based on the `duration` parameter and cannot be updated.

**Errors:**
- `400 Bad Request`: "Availability slot with ID {slot_id} not found"
- `400 Bad Request`: "Only the tutor who owns this slot can update it"
- `400 Bad Request`: "Start time must be before end time"
- `400 Bad Request`: "This time slot overlaps with an existing availability slot"

---

### 8. Delete Availability Slot
Delete an availability slot. Only the tutor who owns the slot can delete it.

- **Endpoint:** `DELETE /schedule/tutors/{tutor_id}/availability-slots/{slot_id}`
- **Path Params:**
  - `tutor_id` (required): ID of the tutor (for authorization)
  - `slot_id` (required): ID of the slot to delete

**Example Request:**
```bash
curl -X DELETE http://127.0.0.1:8000/schedule/tutors/7/availability-slots/1
```

**Response:**
```json
{
  "message": "Availability slot deleted successfully"
}
```

**Errors:**
- `400 Bad Request`: "Availability slot with ID {slot_id} not found"
- `400 Bad Request`: "Only the tutor who owns this slot can delete it"

---

## Booking Status Workflow

1. **Student Creates Booking**: `POST /schedule/bookings` → Creates booking with `status: "pending"`
2. **Tutor Views Requests**: `GET /schedule/bookings?tutor_id=X&status=pending` → Shows all pending requests
3. **Tutor Approves/Rejects**: `PUT /schedule/bookings/{id}/status` → Updates status to `confirmed` or `cancelled`
4. **Slot Availability**: Pending and confirmed bookings both block availability; cancelled bookings free the slot

---

## Availability Slot vs Availability Check

- **Availability Slots** (`/schedule/tutors/{id}/availability-slots`): Manage recurring weekly schedule (e.g., "Every Monday 10am-2pm"). Slots have a `valid_until` date and expire automatically.
- **Availability Check** (`/schedule/tutors/{id}/availability?date=YYYY-MM-DD`): Get available 1-hour slots for a specific date, considering existing bookings and slot expiry.

## Slot Duration & Expiry

When creating an availability slot, you can specify how long it should be valid:

| Duration | Days | Example |
|----------|------|---------|
| `week` | 7 | Created Nov 28 → Expires Dec 5 |
| `month` | 28 | Created Nov 28 → Expires Dec 26 |
| `semester` (default) | 112 | Created Nov 28 → Expires Mar 20 |
| `forever` | — | Never expires |

Expired slots are automatically filtered out from all queries.

---

## Integration Notes for Frontend

1.  **Availability Check First:** Always call the availability endpoint before allowing a user to select a time. This ensures they don't pick an already booked slot (pending bookings are also excluded from availability).
2.  **Booking Approval Flow:** After a student creates a booking, it starts as `pending`. Tutors should fetch pending requests using `GET /schedule/bookings?tutor_id=X&status=pending` and use the status update endpoint to approve or reject them.
3.  **Tutor Schedule Setup:** Tutors should use the availability slot endpoints to set up their recurring weekly schedule. The availability check endpoint uses these slots to calculate available times.
4.  **Timezones:** The API expects and returns ISO 8601 datetime strings. Ensure you handle timezone conversion if necessary (currently assumes local server time or UTC depending on DB config).
5.  **Error Handling:** Handle 400 errors gracefully when booking fails due to a race condition (someone else booked it just before) or when status updates fail due to authorization issues.
6.  **Status Display:** Show appropriate UI indicators for booking status - "Pending Approval" for pending bookings, "Confirmed" for approved sessions, and handle cancelled bookings appropriately.
