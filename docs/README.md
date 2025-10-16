# Unified API Management System – Tricolor Edition

## Overview
The Unified API Management System is a Node.js + Express application backed by SQLite. It demonstrates:

- Public and private route segregation via a global `ROUTE_MODE` toggle.
- JWT authentication with role-based authorization and single-session enforcement per IP.
- Rate limiting and IP blocking, strict CORS, and Swagger/OpenAPI documentation.
- A tricolor-themed frontend dashboard for interacting with the API.

## Project Structure
```
server.js
config/
  db.js          # SQLite initialization and seeding
  mode.js        # Global route mode helper
middleware/
  auth.js        # JWT authentication and authorization
  cors.js        # Strict CORS configuration
  limiter.js     # Rate limiting and blocking logic
  singleSession.js # IP-bound token tracking
routes/
  public.js      # Routes exposed in public mode
  private.js     # Authenticated/private routes, including admin actions
public/
  index.html     # Tricolor dashboard UI
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. Visit the interfaces:
   - Swagger docs: http://localhost:3000/docs
   - Dashboard UI: http://localhost:3000/

On first run, `config/db.js` automatically creates `database.sqlite` (ignored by git) and seeds demo users:

| Name       | Username | Role  |
|------------|----------|-------|
| Aman Rajak | aman     | admin |
| Sia        | sia      | user  |

## Authentication Flow
- Obtain a JWT using `POST /private/login` with `{ "username": "aman" | "sia" }`.
- Tokens include the client's IP and expire after 10 minutes.
- Subsequent logins from the same IP invalidate previous tokens (`singleSession` middleware).

## Route Catalogue
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/public/info` | GET | Public information endpoint. | Public |
| `/private/secure` | GET | Requires valid JWT; returns secure data. | Private |
| `/private/login` | POST | Issues JWT tokens for valid users. | Private |
| `/private/admin/users` | GET | Lists all users; admin role required. | Admin |
| `/private/admin/toggle` | POST | Switches global route mode between public/private; admin only. | Admin |

> When `ROUTE_MODE` is set to `private`, all routes require authentication via the middleware.

## Rate Limiting & Blocking
- Maximum **3 requests per minute per IP**.
- Each violation increments a warning counter.
- On the **4th violation**, the IP is permanently blocked until the process restarts.

## CORS Policy
Only requests originating from `http://192.168.1.15:3000` are allowed. Other origins receive a 403 response.

## Swagger/OpenAPI
Swagger UI is mounted at `/docs` using swagger-jsdoc and swagger-ui-express. All routes are documented with tags (`Public`, `Private`, `Admin`) and JWT bearer authentication is supported via the UI's "Authorize" button.

## Frontend Dashboard
The `/public/index.html` dashboard uses saffron, white, and green styling inspired by the Indian tricolor. It provides:

- Display of the current `ROUTE_MODE`.
- Login form that shows the retrieved JWT token.
- Buttons to call the main public, private, and admin endpoints with responses rendered in a styled card.

## Development Notes
- Use parameterized queries (`?`) for all database operations.
- Numeric inputs should be validated with `/^-?\d+$/` before use.
- Handle JWT expiration by returning `401` with a descriptive error.

## Resetting the Database
Delete the local `database.sqlite` file and restart the server to recreate and reseed the database automatically.
