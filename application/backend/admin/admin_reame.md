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