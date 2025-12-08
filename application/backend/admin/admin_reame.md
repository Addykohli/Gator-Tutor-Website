# Admin Documentation

## Reports Endpoints
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

## Course Management Endpoints


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

## Tutor Management Enpoints

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


TODO: 
deactivate a users profile,
delete related tutor_courses entries for ever demoted tutor.