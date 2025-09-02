# Frontend-Backend Connection Flow

## 🔄 Complete Connection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. UsersPage Component                                              │
│     └─> useUsers() hook                                              │
│         └─> useUsersApi() hook                                       │
│             └─> userApiService.getUsers()                            │
│                 └─> apiService.get('/api/users?page=1&limit=10')     │
│                     └─> fetch('http://localhost:3000/api/users?...')│
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTP Request
                               │ + Headers:
                               │   - Content-Type: application/json
                               │   - X-Correlation-Id: uuid
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND (NestJS)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CORS Middleware (allows http://localhost:5173, :5174)           │
│  2. Correlation ID Middleware                                        │
│  3. UserController.findAll()                                         │
│     └─> UserQueryService.findManyPaginated()                         │
│         └─> UserRepository.findMany({ skip, take })                  │
│             └─> Prisma → PostgreSQL                                  │
│                                                                      │
│  4. Response transformed to SafeUserDto[]                            │
│     (excludes sensitive fields)                                      │
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTP Response
                               │ + SafeUserDto[] data
                               ▼
                        Back to Frontend
```

## 📁 Key Files in the Connection

### Frontend Side:

1. **Configuration** (`src/config/index.ts`):
   ```typescript
   baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
   ```

2. **API Service** (`src/services/api.ts`):
   ```typescript
   async get<T>(endpoint: string): Promise<T> {
     return this.request<T>(endpoint, { method: 'GET' })
   }
   
   private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
     const response = await fetch(`${this.baseUrl}${endpoint}`, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         ...CorrelationIdService.getHeaders(),
       },
     })
   }
   ```

3. **User API Service** (`src/services/user-api.ts`):
   ```typescript
   async getUsers(page = 1, limit = 10): Promise<ApiResponse<UserListResponse>> {
     return apiService.get<ApiResponse<UserListResponse>>(
       `${UserApiService.BASE_PATH}?page=${page}&limit=${limit}`
     )
   }
   ```

4. **React Hook** (`src/hooks/useUsersApi.ts`):
   ```typescript
   const fetchUsers = useCallback(async (): Promise<void> => {
     setLoading(true);
     const response = await userApiService.getUsers(1, 50);
     setUsers(response.data.users);
     setLoading(false);
   }, []);
   ```

### Backend Side:

1. **CORS Configuration** (`src/main.ts`):
   ```typescript
   app.enableCors({
     origin: configService.get('CORS_ORIGIN'), // http://localhost:5173
     credentials: true,
   });
   ```

2. **User Controller** (`src/user/user.controller.ts`):
   ```typescript
   @Get()
   public async findAll(
     @Query(ValidationPipe) pagination: PaginationDto,
   ): Promise<{ users: SafeUserDto[]; pagination: Record<string, number> }> {
     const { users, total } = await this.userQueryService.findManyPaginated(page, limit);
     
     const safeUsers = plainToInstance(SafeUserDto, users, {
       excludeExtraneousValues: true,
     });
     
     return { users: safeUsers, pagination: { ... } };
   }
   ```

## 🔍 Example: What Happens When You Load the Users Page

1. **User navigates to http://localhost:5174/users**

2. **React renders UsersPage component**

3. **useEffect in useUsers hook triggers:**
   ```typescript
   useEffect(() => {
     fetchUsers();
   }, []);
   ```

4. **Frontend makes HTTP request:**
   ```
   GET http://localhost:3000/api/users?page=1&limit=50
   Headers:
     Content-Type: application/json
     X-Correlation-Id: 5bc217dd-9a21-4884-9789-99a9ef61d5b9
   ```

5. **Backend processes request:**
   - CORS allows request from localhost:5174
   - Correlation ID middleware adds ID to all logs
   - UserController receives request
   - UserQueryService queries database with Prisma
   - Data transformed to SafeUserDto (no sensitive fields)

6. **Backend returns response:**
   ```json
   {
     "success": true,
     "data": {
       "users": [...],  // SafeUserDto[] 
       "pagination": { "page": 1, "limit": 50, "total": 7 }
     },
     "correlationId": "5bc217dd-9a21-4884-9789-99a9ef61d5b9"
   }
   ```

7. **Frontend updates state:**
   ```typescript
   setUsers(response.data.users);
   setLoading(false);
   ```

8. **React re-renders with user data in table**

## 🛡️ Security Features in the Connection

- **CORS**: Only allows requests from configured origins
- **Input Sanitization**: SanitizationPipe on all POST/PATCH
- **Safe DTOs**: Sensitive fields never sent to frontend
- **Correlation IDs**: Track requests across frontend/backend
- **Error Handling**: Standardized exceptions with safe messages