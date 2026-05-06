# SmartBrik Backend

Production-ready Node.js backend for the SmartBrik real-estate fractional investment platform.

## Stack

- **Node.js** + **Express.js**
- **Prisma ORM** + **PostgreSQL**
- **JWT** authentication, **bcrypt** password hashing
- **Role-based access**: BUILDER, INVESTOR

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment**
   - Edit `.env` and set `DATABASE_URL` to your PostgreSQL connection string
   - Set `JWT_SECRET` (use a strong secret in production)
   - The app loads environment variables from `.env` via dotenv

3. **Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   Or for migrations: `npx prisma migrate dev --name init`

4. **Run**
   ```bash
   npm run dev
   ```
   API base: `http://localhost:4000`

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/builder/register` | Register builder |
| POST | `/api/auth/builder/login` | Login builder |
| POST | `/api/auth/investor/register` | Register investor |
| POST | `/api/auth/investor/login` | Login investor |

### Builder (Bearer token, role BUILDER)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/builders/me` | Own profile |
| GET | `/api/builders/projects` | Own projects |
| GET | `/api/builders/projects/:projectId/investments` | Investments on a project |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects (query: `?status=ACTIVE`) |
| GET | `/api/projects/:id` | Get project by ID |
| POST | `/api/projects` | Create project (Builder) |
| PATCH | `/api/projects/:id` | Update project (Builder) |
| DELETE | `/api/projects/:id` | Delete project (Builder) |

### Investor (Bearer token, role INVESTOR)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/investments` | Invest in project (body: projectId, amount, paymentId?) |
| GET | `/api/investments/portfolio` | Portfolio (projects invested in) |
| GET | `/api/investments/returns` | Returns & profits |

### Payments (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create payment record |
| GET | `/api/payments` | List my payments |
| PATCH | `/api/payments/:id/link-investment` | Link payment to investment |

### Returns (Builder)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/returns/distribute` | Trigger profit distribution (body: projectId, totalProfit) |
| GET | `/api/returns/project/:projectId` | Distributions for a project |

### KYC (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kyc` | Submit KYC (documentType, documentNumber, documentImage?) |
| GET | `/api/kyc/me` | My KYC status and submissions |

## Project structure

```
backend/
├── prisma/schema.prisma
├── controllers/
├── routes/
├── middleware/
├── utils/
├── app.js
├── server.js
└── .env
```

## Notes

- Builder login requires `isApproved === true`. Toggle in DB or add an approval flow later.
- Investment is unique per (investorId, projectId). One investment per investor per project.
- Returns distribution calculates each investor’s share from `sharesPurchased / totalShares`.
