# API Documentation - Search & Filter System

## Overview
The Search & Filter System API allows users to search for tutors and courses with advanced filtering options similar to Amazon-style search.

## Base URL
`http://127.0.0.1:8000` (Local) or Production URL

---

## Endpoints

### 1. Get Filter Options
Get available filter options (departments, languages, price range) for populating filter UI components.

- **Endpoint:** `GET /search/filters`
- **Query Params:** None

**Example Request:**
```bash
curl "http://127.0.0.1:8000/search/filters"
```

**Response:**
```json
{
  "departments": [
    {
      "code": "CSC",
      "count": 5
    },
    {
      "code": "MATH",
      "count": 3
    }
  ],
  "languages": [
    {
      "name": "English",
      "count": 10
    },
    {
      "name": "Spanish",
      "count": 2
    }
  ],
  "price_range": {
    "min": 1500,
    "max": 7500
  },
  "location_modes": [
    {
      "mode": "online",
      "count": 8
    },
    {
      "mode": "campus",
      "count": 5
    }
  ],
  "weekdays": [
    {
      "weekday": 0,
      "count": 3
    },
    {
      "weekday": 1,
      "count": 7
    }
  ]
}
```

---

### 2. Search Tutors (with Filters)
Search for tutors with advanced filtering options.

- **Endpoint:** `GET /search/tutors`
- **Query Params:**
  - `q` (optional): General search query for tutor names
  - `tutor_name` (optional): Search query specifically for tutor names
  - `department` (optional): Single department code (e.g., `CSC`)
  - `departments` (optional): Multiple department codes, comma-separated (e.g., `CSC,MATH`)
  - `course_number` (optional): Course number (e.g., `210`)
  - `course_levels` (optional): Course levels, comma-separated (e.g., `100,200,300`)
  - `min_rate` (optional): Minimum hourly rate in cents (e.g., `2000` = $20.00)
  - `max_rate` (optional): Maximum hourly rate in cents (e.g., `5000` = $50.00)
  - `languages` (optional): Languages, comma-separated (e.g., `English,Spanish`)
  - `sort_by` (optional): Sort field - `price` or `name` (default: `price`)
  - `sort_order` (optional): Sort order - `asc` or `desc` (default: `asc`)
  - `weekday` (optional): Filter by weekday (0=Sunday, 6=Saturday)
  - `available_after` (optional): Filter tutors available after this time (HH:MM:SS)
  - `available_before` (optional): Filter tutors available before this time (HH:MM:SS)
  - `location_modes` (optional): Location modes, comma-separated (e.g., `online,campus`)
  - `has_availability` (optional): Filter tutors that have availability slots (true/false)
  - `limit` (optional): Number of results per page (default: 20, max: 50)
  - `offset` (optional): Pagination offset (default: 0)

**Example Requests:**

**Basic search:**
```bash
curl "http://127.0.0.1:8000/search/tutors?q=john"
```

**Price range filter:**
```bash
curl "http://127.0.0.1:8000/search/tutors?min_rate=2000&max_rate=4000"
```

**Language filter:**
```bash
curl "http://127.0.0.1:8000/search/tutors?languages=Spanish"
```

**Multiple departments:**
```bash
curl "http://127.0.0.1:8000/search/tutors?departments=CSC,MATH"
```

**Course level filter:**
```bash
curl "http://127.0.0.1:8000/search/tutors?course_levels=100,200"
```

**Combined filters:**
```bash
curl "http://127.0.0.1:8000/search/tutors?min_rate=2000&max_rate=5000&languages=English&departments=CSC&sort_by=price&sort_order=desc"
```

**Availability filter:**
```bash
curl "http://127.0.0.1:8000/search/tutors?weekday=1&location_modes=online&available_after=09:00:00"
```

**Response:**
```json
{
  "items": [
    {
      "tutor_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "hourly_rate_cents": 3000,
      "languages": ["English", "Spanish"],
      "avg_rating": null,
      "sessions_completed": null,
      "courses": [
        {
          "department_code": "CSC",
          "course_number": "210",
          "title": "Introduction to Programming"
        }
      ],
      "profile_image_path_thumb": "path/to/thumb.jpg",
      "profile_image_path_full": "path/to/full.jpg"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### 3. Search Courses
Search for courses with filtering options.

- **Endpoint:** `GET /search/courses`
- **Query Params:**
  - `q` (optional): Search query for course title, department code, or course number
  - `department` (optional): Department code (e.g., `CSC`)
  - `course_number` (optional): Course number (e.g., `210`)
  - `limit` (optional): Number of results per page (default: 20, max: 50)
  - `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl "http://127.0.0.1:8000/search/courses?q=python&department=CSC"
```

**Response:**
```json
{
  "items": [
    {
      "course_id": 1,
      "department_code": "CSC",
      "course_number": "210",
      "title": "Introduction to Programming in Python",
      "tutor_count": 3
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### 4. Search All (Tutors and Courses)
Search for both tutors and courses in a single request.

- **Endpoint:** `GET /search/all`
- **Query Params:**
  - `q` (optional): Search query for both tutors and courses
  - `limit` (optional): Total limit - split between tutors and courses (default: 20, max: 50)
  - `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl "http://127.0.0.1:8000/search/all?q=python"
```

**Response:**
```json
{
  "tutors": [
    {
      "tutor_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "hourly_rate_cents": 3000,
      "languages": ["English"],
      "courses": [
        {
          "department_code": "CSC",
          "course_number": "210",
          "title": "Introduction to Programming"
        }
      ]
    }
  ],
  "courses": [
    {
      "course_id": 1,
      "department_code": "CSC",
      "course_number": "210",
      "title": "Introduction to Programming in Python",
      "tutor_count": 3
    }
  ],
  "tutor_total": 1,
  "course_total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### 5. Get Tutor Details
Get detailed information for a specific tutor.

- **Endpoint:** `GET /search/tutors/{tutor_id}`
- **Path Params:**
  - `tutor_id` (required): ID of the tutor

**Example Request:**
```bash
curl "http://127.0.0.1:8000/search/tutors/1"
```

**Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@mail.sfsu.edu",
  "hourly_rate_cents": 3000,
  "bio": "Experienced tutor in computer science...",
  "courses": [
    {
      "department_code": "CSC",
      "course_number": "210",
      "title": "Introduction to Programming"
    }
  ],
  "languages": ["English", "Spanish"],
  "avg_rating": null,
  "sessions_completed": null,
  "profile_image_path_full": "path/to/full.jpg",
  "profile_image_path_thumb": "path/to/thumb.jpg"
}
```

---

## Filter Usage Guide for Frontend

### Filter Options Endpoint
Call `/search/filters` on page load to populate filter dropdowns/checkboxes with available options and counts.

### Price Range Filter
- `min_rate`: Minimum price in cents (e.g., 2000 = $20.00)
- `max_rate`: Maximum price in cents (e.g., 5000 = $50.00)
- Frontend can create price buckets: "Under $20", "$20-$35", "$35-$50", "$50+"

### Language Filter
- `languages`: Comma-separated list (e.g., `English,Spanish`)
- Frontend should show checkboxes for each available language
- Multiple languages use OR logic (tutors who speak ANY of the selected languages)

### Department Filter
- `departments`: Comma-separated department codes (e.g., `CSC,MATH`)
- Frontend can show checkboxes or multi-select dropdown
- Multiple departments use OR logic (tutors teaching courses in ANY selected department)

### Course Level Filter
- `course_levels`: Comma-separated levels (e.g., `100,200,300`)
- Frontend can show: "100-Level", "200-Level", "300-Level", "400-Level", "500+"
- Matches courses starting with the level digit (e.g., "1" matches 100-199)

### Sorting Options
- `sort_by`: `price` or `name`
- `sort_order`: `asc` or `desc`
- Frontend dropdown options:
  - "Price: Low to High" (`sort_by=price&sort_order=asc`)
  - "Price: High to Low" (`sort_by=price&sort_order=desc`)
  - "Name: A-Z" (`sort_by=name&sort_order=asc`)
  - "Name: Z-A" (`sort_by=name&sort_order=desc`)

### Availability Filters
- `weekday`: Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
- `available_after`: Time in HH:MM:SS format (e.g., `09:00:00`)
- `available_before`: Time in HH:MM:SS format (e.g., `17:00:00`)
- `location_modes`: Comma-separated location modes (e.g., `online,campus`)
- `has_availability`: Boolean filter to show only tutors with availability slots

### Combining Filters
All filters can be combined. Example:
```
/search/tutors?min_rate=2000&max_rate=5000&languages=English,Spanish&departments=CSC,MATH&weekday=1&location_modes=online&sort_by=price&sort_order=asc
```

This returns tutors who:
- Charge between $20-$50/hr
- Speak English OR Spanish
- Teach CSC OR MATH courses
- Available on Monday (weekday 1)
- Offer online sessions
- Sorted by price (lowest first)

---

## Error Responses

All endpoints return standard HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "detail": "Error message here"
}
```

---

## Notes for Frontend Implementation

1. **Filter Options**: Always fetch `/search/filters` first to get available options
2. **Pagination**: Use `limit` and `offset` for pagination
3. **Comma-separated Values**: When sending multiple values (departments, languages, course_levels), use comma-separated strings
4. **Price in Cents**: All price values are in cents (divide by 100 for display)
5. **Empty Results**: If `total` is 0, show "No results found" message
6. **Loading States**: Show loading indicators while filters are being applied
7. **URL Parameters**: Consider updating browser URL with filter parameters for shareable/bookmarkable search results
8. **Weekday Mapping**: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
9. **Time Format**: Use 24-hour format HH:MM:SS for time filters (e.g., `09:00:00`, `17:30:00`)

