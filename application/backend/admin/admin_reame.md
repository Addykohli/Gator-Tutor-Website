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

## ADMIN: Tutor Management Endpoints

### 
Promote Student to Tutor in user roles.
Demote Tutor to Student.

Still have to do: endpoints to change tutor_profile entries like bio, rate based on application values recieved

### POST /api/admin/tutors/promote/{user_id}
Promote Student to Tutor in user roles, and adds a tutor_profile entry as well with status "approved".
default tutoring rate is 0. Null for bio & languages.

#### Response (201 Created)
````json
{
  "tutor_id": 12,
  "bio": null,
  "hourly_rate_cents": 0,
  "languages": null,
  "status": "approved"
}
````

### PATCH /api/admin/tutors/demote/{user_id}
Demote Tutor to student.
Deletes relevant tutor_profile entry from db table

#### Response (200 OK)
````json
{
  "message": "user 2 demoted to student and tutor_profile removed."
}
````
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

