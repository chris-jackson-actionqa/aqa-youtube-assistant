# Postman Collection Created - YouTube Assistant API

## 📦 Collection Details

**Collection Name:** YouTube Assistant API - Projects CRUD  
**Collection ID:** `14578754-aed4b3ab-39d2-4e9d-91ce-4c430ea96da9`  
**Workspace:** Team Workspace  
**Created:** October 20, 2025

## 🎯 Overview

A complete Postman collection has been created to demonstrate and test all CRUD operations for the YouTube Assistant Projects API.

## 📋 Included Requests

### 1. **Health Check**
- **Method:** GET
- **Endpoint:** `{{baseUrl}}/api/health`
- **Description:** Verify the API is running and healthy
- **Purpose:** Quick check to ensure the backend is operational

### 2. **Create Project**
- **Method:** POST
- **Endpoint:** `{{baseUrl}}/api/projects`
- **Content-Type:** application/json
- **Body:**
```json
{
  "title": "Introduction to Test Automation",
  "description": "A comprehensive guide to getting started with test automation",
  "status": "planned"
}
```
- **Description:** Create a new video project with title, description, and status
- **Expected Response:** 201 Created with project details including ID and timestamps

### 3. **Get All Projects**
- **Method:** GET
- **Endpoint:** `{{baseUrl}}/api/projects`
- **Description:** Retrieve a list of all video projects
- **Expected Response:** 200 OK with array of all projects

### 4. **Get Project by ID**
- **Method:** GET
- **Endpoint:** `{{baseUrl}}/api/projects/1`
- **Description:** Retrieve a specific project by its ID
- **Note:** Replace '1' with the actual project ID
- **Expected Response:** 200 OK with project details or 404 Not Found

### 5. **Update Project**
- **Method:** PUT
- **Endpoint:** `{{baseUrl}}/api/projects/1`
- **Content-Type:** application/json
- **Body:**
```json
{
  "status": "in_progress",
  "description": "Updated description with more details"
}
```
- **Description:** Update an existing project (supports partial updates)
- **Note:** Only send the fields you want to change
- **Expected Response:** 200 OK with updated project details

### 6. **Delete Project**
- **Method:** DELETE
- **Endpoint:** `{{baseUrl}}/api/projects/1`
- **Description:** Delete a project by its ID
- **Expected Response:** 204 No Content on success

## 🔧 Variables

The collection includes a pre-configured variable:

- **baseUrl:** `http://localhost:8000`
  - Description: Base URL for the YouTube Assistant API
  - Can be changed for different environments (dev, staging, production)

## 🚀 How to Use

### In Postman Web or Desktop App:

1. **Access the Collection:**
   - Log in to Postman with account: sethalicious@gmail.com
   - Navigate to the "Team Workspace"
   - Find "YouTube Assistant API - Projects CRUD" collection

2. **Start the Backend:**
   ```bash
   cd /home/sethjackson/dev/aqa-youtube-assistant/backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Test the Endpoints:**
   - Start with "Health Check" to verify the API is running
   - Use "Create Project" to add new projects
   - Use "Get All Projects" to see all created projects
   - Use "Get Project by ID" to view a specific project
   - Use "Update Project" to modify an existing project
   - Use "Delete Project" to remove a project

4. **Testing Workflow:**
   ```
   Health Check → Create Project → Get All Projects → 
   Get Project by ID → Update Project → Get All Projects → 
   Delete Project → Get All Projects
   ```

## 🎓 Testing Scenarios

### Scenario 1: Create and Read
1. Run "Create Project" request
2. Note the returned `id` (e.g., `1`)
3. Update "Get Project by ID" URL to use that ID
4. Run "Get Project by ID" to verify creation

### Scenario 2: Update Workflow
1. Create a project
2. Run "Get All Projects" to see initial state
3. Update the "Update Project" URL with the project ID
4. Modify the request body with desired changes
5. Run "Update Project"
6. Run "Get All Projects" to verify the update

### Scenario 3: Delete Workflow
1. Create multiple projects
2. Run "Get All Projects" to see all projects
3. Choose a project ID to delete
4. Update "Delete Project" URL with that ID
5. Run "Delete Project"
6. Run "Get All Projects" to verify deletion

### Scenario 4: Error Testing
1. Try to get a non-existent project (use ID 9999)
2. Expected: 404 Not Found with error message
3. Try to update a non-existent project
4. Expected: 404 Not Found with error message
5. Try to delete a non-existent project
6. Expected: 404 Not Found with error message

## 📊 Expected Status Codes

| Request | Success Code | Error Codes |
|---------|-------------|-------------|
| Health Check | 200 OK | - |
| Create Project | 201 Created | 422 Unprocessable Entity |
| Get All Projects | 200 OK | - |
| Get Project by ID | 200 OK | 404 Not Found |
| Update Project | 200 OK | 404 Not Found, 422 Unprocessable Entity |
| Delete Project | 204 No Content | 404 Not Found |

## 🔍 What Each Request Demonstrates

1. **Health Check** - Basic connectivity and API status
2. **Create Project** - POST request with JSON body, data validation, database insertion
3. **Get All Projects** - Retrieving list of resources, array response
4. **Get Project by ID** - Path parameters, single resource retrieval, 404 handling
5. **Update Project** - PUT request, partial updates, validation, 404 handling
6. **Delete Project** - DELETE operation, 204 response, 404 handling

## 🌐 Access the Collection

You can access this collection in your Postman account:
- **Workspace:** Team Workspace (sethalicious)
- **Collection Name:** YouTube Assistant API - Projects CRUD

## 📝 Notes

- All requests use the `{{baseUrl}}` variable set to `http://localhost:8000`
- The backend must be running for these requests to work
- The collection demonstrates proper RESTful API design
- Error cases (404) are handled appropriately
- All requests include descriptive documentation

## 🎉 Summary

This Postman collection provides a complete demonstration of:
- ✅ All CRUD operations (Create, Read, Update, Delete)
- ✅ Proper HTTP methods (GET, POST, PUT, DELETE)
- ✅ Request body validation
- ✅ Path parameters
- ✅ Error handling
- ✅ RESTful API conventions
- ✅ Status code best practices

You can now easily test all the backend endpoints through Postman's interactive interface!
