# API Testing Guide - Projects CRUD Operations

This guide demonstrates how to test all the CRUD endpoints for the YouTube Assistant Projects API.

## Prerequisites

1. Backend server running at `http://localhost:8000`
2. API testing tool (Postman, cURL, or Swagger UI at http://localhost:8000/docs)

## Base URL

```
http://localhost:8000
```

---

## 1. Health Check

Verify the API is running.

**Request:**
```http
GET /api/health
```

**cURL:**
```bash
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy"
}
```

---

## 2. CREATE Project

Create a new video project.

**Request:**
```http
POST /api/projects
Content-Type: application/json

{
  "title": "Introduction to Test Automation",
  "description": "A comprehensive guide to getting started with test automation",
  "status": "planned"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Test Automation",
    "description": "A comprehensive guide to getting started with test automation",
    "status": "planned"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "title": "Introduction to Test Automation",
  "description": "A comprehensive guide to getting started with test automation",
  "status": "planned",
  "created_at": "2025-10-19T12:00:00.000000",
  "updated_at": "2025-10-19T12:00:00.000000"
}
```

---

## 3. CREATE Another Project

Create a second project for testing.

**Request:**
```http
POST /api/projects
Content-Type: application/json

{
  "title": "Advanced Selenium Techniques",
  "description": "Deep dive into advanced Selenium features and best practices",
  "status": "in_progress"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Selenium Techniques",
    "description": "Deep dive into advanced Selenium features and best practices",
    "status": "in_progress"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": 2,
  "title": "Advanced Selenium Techniques",
  "description": "Deep dive into advanced Selenium features and best practices",
  "status": "in_progress",
  "created_at": "2025-10-19T12:01:00.000000",
  "updated_at": "2025-10-19T12:01:00.000000"
}
```

---

## 4. READ All Projects

Get a list of all projects.

**Request:**
```http
GET /api/projects
```

**cURL:**
```bash
curl http://localhost:8000/api/projects
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Introduction to Test Automation",
    "description": "A comprehensive guide to getting started with test automation",
    "status": "planned",
    "created_at": "2025-10-19T12:00:00.000000",
    "updated_at": "2025-10-19T12:00:00.000000"
  },
  {
    "id": 2,
    "title": "Advanced Selenium Techniques",
    "description": "Deep dive into advanced Selenium features and best practices",
    "status": "in_progress",
    "created_at": "2025-10-19T12:01:00.000000",
    "updated_at": "2025-10-19T12:01:00.000000"
  }
]
```

---

## 5. READ Single Project

Get details of a specific project by ID.

**Request:**
```http
GET /api/projects/1
```

**cURL:**
```bash
curl http://localhost:8000/api/projects/1
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "title": "Introduction to Test Automation",
  "description": "A comprehensive guide to getting started with test automation",
  "status": "planned",
  "created_at": "2025-10-19T12:00:00.000000",
  "updated_at": "2025-10-19T12:00:00.000000"
}
```

**Error Case - Project Not Found:**
```http
GET /api/projects/999
```

**Expected Response (404 Not Found):**
```json
{
  "detail": "Project with id 999 not found"
}
```

---

## 6. UPDATE Project

Update an existing project (partial update supported).

**Request:**
```http
PUT /api/projects/1
Content-Type: application/json

{
  "status": "in_progress",
  "description": "Updated: A comprehensive guide to getting started with test automation - now with video examples"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:8000/api/projects/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "description": "Updated: A comprehensive guide to getting started with test automation - now with video examples"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "title": "Introduction to Test Automation",
  "description": "Updated: A comprehensive guide to getting started with test automation - now with video examples",
  "status": "in_progress",
  "created_at": "2025-10-19T12:00:00.000000",
  "updated_at": "2025-10-19T12:05:00.000000"
}
```

**Note:** Only provided fields are updated. The `title` remains unchanged.

**Error Case - Project Not Found:**
```http
PUT /api/projects/999
Content-Type: application/json

{
  "status": "completed"
}
```

**Expected Response (404 Not Found):**
```json
{
  "detail": "Project with id 999 not found"
}
```

---

## 7. DELETE Project

Delete a project by ID.

**Request:**
```http
DELETE /api/projects/2
```

**cURL:**
```bash
curl -X DELETE http://localhost:8000/api/projects/2
```

**Expected Response (204 No Content):**
```
(Empty response body)
```

**Verify Deletion:**
```bash
curl http://localhost:8000/api/projects
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Introduction to Test Automation",
    "description": "Updated: A comprehensive guide to getting started with test automation - now with video examples",
    "status": "in_progress",
    "created_at": "2025-10-19T12:00:00.000000",
    "updated_at": "2025-10-19T12:05:00.000000"
  }
]
```

**Error Case - Project Not Found:**
```http
DELETE /api/projects/999
```

**Expected Response (404 Not Found):**
```json
{
  "detail": "Project with id 999 not found"
}
```

---

## Complete Testing Workflow

Here's a complete script to test all endpoints in sequence:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

echo "=== 1. Health Check ==="
curl -s "$BASE_URL/api/health" | jq
echo -e "\n"

echo "=== 2. Create First Project ==="
PROJECT1=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Test Automation",
    "description": "A comprehensive guide to getting started with test automation",
    "status": "planned"
  }')
echo "$PROJECT1" | jq
PROJECT1_ID=$(echo "$PROJECT1" | jq -r '.id')
echo -e "\n"

echo "=== 3. Create Second Project ==="
PROJECT2=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Selenium Techniques",
    "description": "Deep dive into advanced Selenium features",
    "status": "in_progress"
  }')
echo "$PROJECT2" | jq
PROJECT2_ID=$(echo "$PROJECT2" | jq -r '.id')
echo -e "\n"

echo "=== 4. Get All Projects ==="
curl -s "$BASE_URL/api/projects" | jq
echo -e "\n"

echo "=== 5. Get Single Project ==="
curl -s "$BASE_URL/api/projects/$PROJECT1_ID" | jq
echo -e "\n"

echo "=== 6. Update Project ==="
curl -s -X PUT "$BASE_URL/api/projects/$PROJECT1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "description": "Updated description with more details"
  }' | jq
echo -e "\n"

echo "=== 7. Delete Project ==="
curl -s -X DELETE "$BASE_URL/api/projects/$PROJECT2_ID" -w "\nStatus: %{http_code}\n"
echo -e "\n"

echo "=== 8. Verify Deletion - Get All Projects ==="
curl -s "$BASE_URL/api/projects" | jq
echo -e "\n"

echo "=== 9. Test 404 Error ==="
curl -s "$BASE_URL/api/projects/999" | jq
```

Save this as `test_api.sh`, make it executable (`chmod +x test_api.sh`), and run it to test all endpoints.

---

## Using Swagger UI (Recommended)

The easiest way to test the API is using the built-in Swagger UI:

1. Start the backend server
2. Navigate to http://localhost:8000/docs
3. You'll see an interactive interface with all endpoints
4. Click on any endpoint to expand it
5. Click "Try it out" to test the endpoint
6. Fill in the request body (for POST/PUT)
7. Click "Execute" to send the request
8. View the response below

This provides a user-friendly interface with automatic validation and response formatting.

---

## Status Values

Valid status values for projects:
- `planned` - Project is in planning stage
- `in_progress` - Actively working on the project
- `completed` - Project is finished
- `archived` - Project is archived

---

## Validation Rules

- **title**: Required, 1-255 characters
- **description**: Optional, any length
- **status**: Optional, defaults to "planned"

---

## Error Responses

| Status Code | Meaning |
|-------------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 404 | Project Not Found |
| 422 | Validation Error (invalid request body) |

---

## Next Steps

1. Test all endpoints using Swagger UI at http://localhost:8000/docs
2. Create a Postman collection for automated testing
3. Implement frontend integration with these endpoints
4. Add authentication/authorization
5. Add pagination for the list endpoint
6. Add filtering and sorting capabilities
