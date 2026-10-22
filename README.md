# MedVault Frontend

MedVault is a cloud-based medical information management system connecting patients and hospitals securely. This repository contains the frontend application built with React, Vite, Tailwind CSS, and JavaScript.

## Project Structure
- `src/components/`: Reusable UI components, layout elements, and navigation sidebars.
- `src/pages/`: Page views for both Patient and Hospital portals, as well as Auth screens.
- `src/services/api.js`: Centralized endpoint mapping and API configuration utility.

## Integration Guide (Backend Handshake)
All backend communication relies on placeholder URLs defined in `src/services/api.js`. 

Once the AWS backend (API Gateway + Lambda) is fully deployed by the backend developer, replace the placeholder string in `API_BASE`:
```javascript
export const API_BASE = "https://<your-api-gateway-id>.execute-api.<region>.amazonaws.com/prod";
```

## Authentication Flow
Users log in through `/login`, selecting either Patient or Hospital Staff.

Successful authentication returns a JWT token.

The token is stored in `localStorage` under the key `medvault_token` and automatically appended to all subsequent protected API requests in the `Authorization: Bearer <token>` header.
