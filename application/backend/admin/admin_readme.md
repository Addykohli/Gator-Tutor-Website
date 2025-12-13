# Admin Documentation

## ADMIN: Reports Endpoints
GET & POST Reports
Note our original reports design had tutor_id included, but students can be reported too so its been excluded.
inside routers/report_router.py

### POST /api/admin/report

create new report by a user for student or tutor.

#### Request Body
```json
{
  "reporter_id": 1,
  "reported_user_id": 2,
  "reason": "No-show to scheduled meetings."
}
```

#### Response (201 Created)
```json
{
  "report_id": 1,
  "reporter_id": 1,
  "reported_user_id":2,
  "reason": "No-show to scheduled meetings",
  "status":"submitted",
  "created_at": "2026-11-12T02:00:00"
}
```

### GET /api/admin/allreport
List all reports of all users. 

#### Response(200)
```json
{
  "report_id": 1,
  "reporter_id": 1,
  "reported_user_id":2,
  "reason": "No-show to scheduled meetings",
  "status":"submitted",
  "created_at": "2026-11-12T02:00:00"
},
{
  "report_id": 2,
  "reporter_id": 5,
  "reported_user_id":4,
  "reason": "No-Pay",
  "status":"reviewing",
  "created_at": "2026-05-12T02:00:00"
},
```
### GET /api/admin/userreports/{user_id}
List all reports submitted of a single user . 
GET /api/admin/userreports/2

#### Response(200)

```json
{
  "report_id": 1,
  "reporter_id": 1,
  "reported_user_id":2,
  "reason": "No-show to scheduled meetings",
  "status":"submitted",
  "created_at": "2026-11-12T02:00:00"
},
{
  "report_id": 4,
  "reporter_id": 5,
  "reported_user_id":2,
  "reason": "No-show",
  "status":"reviewing",
  "created_at": "2026-05-12T02:00:00"
},
```

### PATCH /api/admin/report/{report_id}/status
/api/admin/report/1
#### Request
````json
{
  "status": "reviewing"
}
````
#### Response (200 ok)
````json
{
  "report_id": 4,
  "reporter_id": 5,
  "reported_user_id":2,
  "reason": "No-show",
  "status":"reviewing",
  "created_at": "2026-05-12T02:00:00"
}
````

## ADMIN: Course Management Endpoints


###	GET /api/admin/allcourses
get all courses in the database.
#### Response body
````json
[
  {
    "course_id": 4,
    "department_code": "ACCT",
    "course_number": "100",
    "title": "Introduction to Financial Accounting",
    "is_active": true
  },
  {
    "course_id": 5,
    "department_code": "BIOL",
    "course_number": "101",
    "title": "Human Biology Laboratory",
    "is_active": true
  }
]
````


### POST /api/admin/addcourse
Adding new course to courses in databse.
##### Request Body
````json
{
  "department_code": "LABR",
  "course_number": "511",
  "title": "Collective Bargaining"
}
````
	
#### Response body(200)
````json
{
  "course_id": 31,
  "department_code": "LABR",
  "course_number": "511",
  "title": "Collective Bargaining",
  "is_active": true
}
````
### PATCH /api/admin/deactivate/{course_id}
Changes course status bool is_active to FALSE.
For when courses are not taught during certain semesters.
#### Request
PATCH /api/admin/deactivate/30

#### Response body(200)
````json
{
  "course_id": 30,
  "department_code": "MATH",
  "course_number": "100",
  "title": "Calculus I",
  "is_active": false
}
````
## ADMIN: Tutor Application Endpoints

Admins can manage student applications to become tutors. They can view all applications, approve, or reject them. Approving an application automatically creates a tutor_profile for the student.

### GET /api/admin/all-tutor-applications

List all tutor applications in the system.

#### Response (200 OK)
````json
[
  {
    "application_id": 1,
    "user_id": 2,
    "full_name": "Erin Low",
    "email": "erin.low@sfsu.edu",
    "gpa": 3.0,
    "courses": "BIO 100",
    "bio": "I want to tutor",
    "status": "pending",
    "created_at": "2026-11-12T02:00:00"
  },
  {
    "application_id": 2,
    "user_id": 5,
    "full_name": "Nina Pak",
    "email": "nina.pak@sfsu.edu",
    "gpa": 3.5,
    "courses": "CHEM 100",
    "bio": "CHEM Major.",
    "status": "approved",
    "created_at": "2026-11-10T15:23:00"
  }
]
````
### PATCH /api/admin/tutor-application/{application_id}/approve

Approve a pending tutor application.
This also automatically creates a tutor_profile entry for the student with status set to "approved" and default hourly_rate_cents of 0.

#### Request
PATCH /api/admin/tutor-application/1/approve

##### Response (200 OK)
````json
{
  "application_id": 1,
  "user_id": 2,
  "full_name": "John Doe",
  "email": "johndoe@example.com",
  "gpa": 3.8,
  "courses": "CSC210, MATH226",
  "bio": "I love teaching programming.",
  "status": "approved",
  "created_at": "2026-11-12T02:00:00",
  "tutor_profile": {
    "tutor_id": 2,
    "bio": "I love teaching programming.",
    "hourly_rate_cents": 0,
    "languages": null,
    "status": "approved"
  }
}
````

**Possible Errors**

- 404 Not Found: Application not found
- 400 Bad Request: Application already approved/rejected

### PATCH /api/admin/tutor-application/{application_id}/reject

Reject a pending tutor application.
This sets the application's status to "rejected" and does not create a tutor profile.

#### Request
PATCH /api/admin/tutor-application/1/reject

#### Response (200 OK)
````json
{
  "application_id": 1,
  "user_id": 2,
  "full_name": "John Doe",
  "email": "johndoe@example.com",
  "gpa": 3.8,
  "courses": "CSC210, MATH226",
  "bio": "I love teaching programming.",
  "status": "rejected",
  "created_at": "2026-11-12T02:00:00"
}
````

**Possible Errors**
- 404 Not Found: Application not found

- 400 Bad Request: Application already approved/rejected


## ADMIN: Tutor Course Request Management Endpoints
For admin to manage tutor requests to add more courses that they can tutor(ie more relevant entries in tutor_courses).

Admin can see all the tutor course requests.
Admin can see all tutor_course_requests.
Admin can approve additional tutor course requests.
Admin can reject additional tutor course requests.

### GET /api/admin/all-tutor-course-requests
Admin can see all the tutor course requests.

#### Response (200)
````json
[
  {
    "request_id": 4,
    "tutor_id": 1,
    "status": "rejected",
    "created_at": "2025-12-07T04:52:41",
    "course": {
      "course_id": 10,
      "department_code": "GEOG",
      "course_number": "445",
      "title": "Geopolitcs and Globalization"
    },
    "tutor": {
      "tutor_id": 1,
      "user": {
        "user_id": 1,
        "first_name": "Sarah",
        "last_name": "Cho"
      }
    }
  },
  {
    "request_id": 3,
    "tutor_id": 1,
    "status": "approved",
    "created_at": "2025-12-07T04:51:28",
    "course": {
      "course_id": 8,
      "department_code": "ERTH",
      "course_number": "444",
      "title": "Hydrogeology"
    },
    "tutor": {
      "tutor_id": 1,
      "user": {
        "user_id": 1,
        "first_name": "Sarah",
        "last_name": "Cho"
      }
    }
  }
]
````

### POST /api/admin/tutor-course-request/{tutor_id}
Tutor creates a Request to be added to tutor_course_request table to be reviewed by Admin.

#### Request Body
/api/admin/tutor-course-request/1
````json
{
  "course_id": 10
}
````
#### Response (200)
````json
{
  "request_id": 5,
  "tutor_id": 1,
  "status": "pending",
  "created_at": "2025-12-07T09:04:00",
  "course": {
    "course_id": 4,
    "department_code": "ACCT",
    "course_number": "100",
    "title": "Introduction to Financial Accounting"
  },
  "tutor": {
    "tutor_id": 1,
    "user": {
      "user_id": 1,
      "first_name": "Sarah",
      "last_name": "Cho"
    }
  }
}
````
**Possible Errors**
- 404: Tutor not found
- 404: Course not found


### PATCH /api/admin/tutor-course-request/{request_id}/approve
Admin can approve request (which will also add course to tutor_courses table in db & change the status to "approved" in tutor_course_requests)

#### Request
/api/admin/tutor-course-request/3/approve

#### Response 200
````json
{
  "request_id": 5,
  "tutor_id": 1,
  "status": "approved",
  "created_at": "2025-12-07T09:04:00",
  "course": {
    "course_id": 4,
    "department_code": "ACCT",
    "course_number": "100",
    "title": "Introduction to Financial Accounting"
  },
  "tutor": {
    "tutor_id": 1,
    "user": {
      "user_id": 1,
      "first_name": "Sarah",
      "last_name": "Cho"
    }
  }
}
````
**Possible Errors**
- 404: request not found
- 400: Course request already approved/rejected
- 400: tutor already has this course approved and added.

### PATCH /api/admin/tutor-course-request/{request_id}/reject 
Admin can reject additional course request. This just changes the status in the related entry of tutor_course_request to "rejected".(this does not modify tutor_courses table in db)

#### Request
/api/admin/tutor-course-request/4/reject

#### Response (200)
````json
{
  "request_id": 2,
  "tutor_id": 1,
  "status": "rejected",
  "created_at": "2025-12-07T04:50:21",
  "course": {
    "course_id": 3,
    "department_code": "MATH",
    "course_number": "226",
    "title": "Calculus I"
  },
  "tutor": {
    "tutor_id": 1,
    "user": {
      "user_id": 1,
      "first_name": "Sarah",
      "last_name": "Cho"
    }
  }
}
````
**Possible Errors**
- 404: request not found
- 400: Course request already approved/rejected



### DELETE /api/admin/tutor/{tutor_id}/course/{course_id}
Admin can remove tutor_course entry with corresponding tutor_id and course_id.
### Request
/api/admin/tutor/1/course/1

### Response (200)
````json
{
  "detail": "Tutor's course removed.",
  "tutor_id": 1,
  "tutor_name": "Sarah Cho",
  "course_id": 1,
  "removed_course_title": "Introduction to Programming in Python"
}
````
**Possible Errors**
- 404: course/tutor not found
- 404: Not currently a tutor of this course.

## ADMIN: Delete User (Soft Delete) Endpoint

The Admin Delete User API provides functionality for administrators to soft-delete users from the system. Unlike hard deletion, soft deletion preserves all user data and related records for historical purposes while preventing the user from accessing the system.

### DELETE /api/admin/drop-user/{user_id}

Soft deletes a user by setting the `is_deleted` flag to `true`. The user record remains in the database, but they cannot log in or appear in search results.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | Yes | The ID of the user to delete |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | No | Optional role verification. If provided, the user's role must match this value. Valid values: `tutor`, `student`, `admin`, `both` |

#### Request Example

```bash
# Delete a user without role verification
DELETE /api/admin/drop-user/123

# Delete a user with role verification
DELETE /api/admin/drop-user/123?role=student
```

#### Response

**Success Response (200 OK)**

```json
{
  "message": "User John Doe (john.doe@sfsu.edu) successfully deleted",
  "deleted_user_id": 123,
  "deleted_email": "deleted_123_john.doe@sfsu.edu",
  "deleted_name": "John Doe",
  "deleted_role": "student"
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Success message with user details (includes original email in message) |
| `deleted_user_id` | integer | ID of the deleted user |
| `deleted_email` | string | Anonymized email address (format: `deleted_{user_id}_{original_email}`) |
| `deleted_name` | string | Full name of the deleted user |
| `deleted_role` | string | Role of the deleted user (`tutor`, `student`, `admin`, or `both`) |

**Note**: The response does not include `related_records_deleted` because soft delete preserves all related records. All bookings, messages, reports, and other data remain intact.

#### Error Responses

**404 Not Found**

User with the specified ID does not exist.

```json
{
  "detail": "User not found"
}
```

**400 Bad Request**

Role verification failed - the user's role doesn't match the provided role parameter.

```json
{
  "detail": "User role mismatch. Expected tutor, but user has role student"
}
```

**500 Internal Server Error**

An unexpected error occurred during deletion.

```json
{
  "detail": "Error deleting user: {error message}"
}
```

### How Soft Delete Works

#### What Happens When a User is Deleted

1. **User Flag Set**: The user's `is_deleted` field is set to `true`
2. **Email Anonymization**: The user's email is anonymized to `deleted_{user_id}_{original_email}` to prevent reuse while maintaining database unique constraints
3. **Tutor Profile Deactivation**: If the user is a tutor (role is `tutor` or `both`), their tutor profile status is set to `rejected`, which hides them from tutor search results
4. **Data Preservation**: All user data and related records remain in the database:
   - Bookings (as tutor or student)
   - Chat messages (sent and received)
   - Reports (as reporter or reported user)
   - Tutor applications
   - Course requests
   - Tutor course requests
   - All other related records

#### What Users Cannot Do After Deletion

- **Cannot Log In**: Deleted users are filtered out of authentication queries
- **Hidden from Search**: Deleted users do not appear in tutor or user searches
- **Cannot Access System**: All API endpoints that check user authentication will reject deleted users

#### What Data is Preserved

All historical data is preserved:
- Booking history
- Chat message history
- Report history
- Application history
- Course request history

This allows administrators to:
- Maintain audit trails
- Preserve historical records
- Investigate past issues
- Restore users if needed (by setting `is_deleted = false`)

### Role Verification

The optional `role` query parameter allows administrators to add an extra safety check:

```bash
# This will only delete the user if their role is "student"
DELETE /api/admin/drop-user/123?role=student
```

If the user's role doesn't match the provided role, a 400 error is returned and the deletion is aborted.

### Use Cases

#### Delete a Student

```bash
DELETE /api/admin/drop-user/456?role=student
```

#### Delete a Tutor

```bash
DELETE /api/admin/drop-user/789?role=tutor
```

When a tutor is deleted, their profile is automatically deactivated, removing them from tutor search results.

#### Delete a User Without Role Check

```bash
DELETE /api/admin/drop-user/123
```

Use this when you're certain about the user ID and don't need role verification.

### Database Schema

The `users` table includes an `is_deleted` boolean field:

```sql
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_users_is_deleted ON users(is_deleted);
```

### Security Considerations

1. **Admin Only**: This endpoint should only be accessible to administrators
2. **Role Verification**: Use the `role` parameter when you want to ensure you're deleting the correct type of user
3. **Audit Trail**: Consider logging all user deletions for audit purposes
4. **Reversibility**: Soft delete allows for user restoration if needed

**Possible Errors**
- 404 Not Found: User not found
- 400 Bad Request: User role mismatch (when role verification fails)
- 500 Internal Server Error: Database error during deletion

