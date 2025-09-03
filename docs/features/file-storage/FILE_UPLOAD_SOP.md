# File Upload & Management SOP Guide

## Overview
Complete Standard Operating Procedure for the USAsset file upload system with Azure Blob Storage integration, metadata extraction, and frontend integration.

## Quick Reference

### API Endpoints
```bash
POST   /api/files              # Upload file
GET    /api/files              # List all files (with pagination)
GET    /api/files/:id/download # Get download URL
DELETE /api/files/:id          # Delete file
```

### File Operations Workflow
1. **Upload** → File stored in Azure + metadata in database
2. **Process** → Extract CSV/Excel data → Transform → Insert to target tables
3. **Manage** → List, download, delete files via API
4. **Frontend** → React components for file management

### Key URLs
- **Frontend Files Page**: http://localhost:5173/files
- **Backend API Base**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api-docs

---

## 1. Basic File Operations

### Upload File
```bash
curl -X POST http://localhost:3000/api/files \
  -F "file=@/path/to/file.csv" \
  -H "Content-Type: multipart/form-data"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "filename": "1756872437740-file.csv",
    "original_name": "file.csv",
    "mimetype": "text/csv",
    "size": 1024,
    "created_at": "2025-09-03T04:07:18.034Z"
  }
}
```

### List Files (with pagination)
```bash
curl "http://localhost:3000/api/files?page=1&limit=10"
```

### Download File
```bash
curl "http://localhost:3000/api/files/{file-id}/download"
# Returns: {"url": "https://usassetstoragedev.blob.core.windows.net/uploads/..."}
```

### Delete File
```bash
curl -X DELETE "http://localhost:3000/api/files/{file-id}"
```

---

## 2. Data Extraction & Processing

### CSV Processing Strategy

#### Option A: Direct Database Import (Recommended for simple CSVs)
```typescript
// In a service class
async processCsvUpload(fileId: string, targetTable: 'users' | 'projects') {
  const file = await this.findFileById(fileId);
  const downloadUrl = await this.storageService.getDownloadUrl(fileId);
  
  // Download and parse CSV
  const csvContent = await fetch(downloadUrl).then(r => r.text());
  const records = parse(csvContent, { headers: true });
  
  // Validate and transform
  const validRecords = records.map(this.validateAndTransform);
  
  // Bulk insert to target table
  await this.prisma[targetTable].createMany({ data: validRecords });
  
  // Update file metadata
  await this.updateFileStatus(fileId, 'processed', records.length);
}
```

#### Option B: Staged Processing (Recommended for complex files)
```typescript
// 1. Upload file → Store metadata
// 2. Parse file → Store in staging table
// 3. Validate data → Mark errors
// 4. Transform data → Apply business rules  
// 5. Import to target → Bulk insert
// 6. Archive file → Update status
```

### Metadata Extraction
```typescript
interface FileProcessingMetadata {
  file_id: string;
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  records_total: number;
  records_processed: number;
  records_failed: number;
  error_details?: string[];
  processed_at?: Date;
}
```

---

## 3. Database Integration

### File Metadata Schema
```sql
-- Already implemented in Prisma schema
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR NOT NULL,
  original_name VARCHAR NOT NULL,
  mimetype VARCHAR NOT NULL,
  size INTEGER NOT NULL,
  blob_url VARCHAR NOT NULL,
  container_name VARCHAR NOT NULL,
  blob_name VARCHAR NOT NULL,
  
  -- Processing metadata
  processing_status VARCHAR DEFAULT 'uploaded',
  records_total INTEGER,
  records_processed INTEGER,
  
  -- Audit trail
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,
  deleted_at TIMESTAMP,
  deleted_by UUID
);
```

### Common Processing Patterns

#### CSV → Users Import
```typescript
async importUsersFromCsv(fileId: string) {
  const csvData = await this.parseCsvFile(fileId);
  
  const userRecords = csvData.map(row => ({
    email: row.email?.trim().toLowerCase(),
    name: row.name?.trim(),
    role: this.validateRole(row.role),
    created_at: new Date(),
  }));
  
  // Validate emails are unique
  const existingEmails = await this.checkExistingEmails(userRecords);
  const newUsers = userRecords.filter(u => !existingEmails.includes(u.email));
  
  // Bulk insert
  await this.prisma.user.createMany({ data: newUsers });
  
  return { imported: newUsers.length, skipped: existingEmails.length };
}
```

#### Excel → Assets Import
```typescript
async importAssetsFromExcel(fileId: string) {
  const excelData = await this.parseExcelFile(fileId); // Use xlsx library
  
  const assetRecords = excelData.map(row => ({
    name: row['Asset Name'],
    serial_number: row['Serial Number'],
    category: this.mapCategory(row['Category']),
    owner_id: this.lookupUserId(row['Owner Email']),
  }));
  
  await this.prisma.asset.createMany({ data: assetRecords });
}
```

---

## 4. Frontend Integration

### React File Upload Component
```typescript
// src/components/FileUpload.tsx
export function FileUpload({ onUploadSuccess }: { onUploadSuccess: (file: FileResponse) => void }) {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      onUploadSuccess(result.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        onChange={e => handleUpload(e.target.files[0])} 
        accept=".csv,.xlsx,.xls"
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### File Management Grid
```typescript
// src/components/FileManagement.tsx
export function FileManagement() {
  const [files, setFiles] = useState<FileResponse[]>([]);
  
  const loadFiles = async () => {
    const response = await fetch('/api/files');
    const result = await response.json();
    setFiles(result.data.files);
  };
  
  const deleteFile = async (fileId: string) => {
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    loadFiles(); // Refresh list
  };
  
  const downloadFile = async (fileId: string) => {
    const response = await fetch(`/api/files/${fileId}/download`);
    const result = await response.json();
    window.open(result.data.url, '_blank');
  };
  
  return (
    <table>
      <thead>
        <tr>
          <th>File Name</th>
          <th>Size</th>
          <th>Uploaded</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.map(file => (
          <tr key={file.id}>
            <td>{file.original_name}</td>
            <td>{(file.size / 1024).toFixed(1)} KB</td>
            <td>{new Date(file.created_at).toLocaleString()}</td>
            <td>
              <button onClick={() => downloadFile(file.id)}>Download</button>
              <button onClick={() => deleteFile(file.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 5. Advanced Processing Workflows

### Batch Processing Job
```typescript
// Background job for processing uploaded files
@Injectable()
export class FileProcessingService {
  async processUploadedFiles() {
    const pendingFiles = await this.prisma.file.findMany({
      where: { processing_status: 'uploaded' }
    });
    
    for (const file of pendingFiles) {
      await this.processFile(file.id);
    }
  }
  
  private async processFile(fileId: string) {
    try {
      await this.updateStatus(fileId, 'processing');
      
      const result = await this.extractAndImportData(fileId);
      
      await this.updateStatus(fileId, 'completed', {
        records_processed: result.imported,
        records_total: result.total
      });
    } catch (error) {
      await this.updateStatus(fileId, 'failed', { error: error.message });
    }
  }
}
```

### Data Validation Pipeline
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class DataValidator {
  validateUserRecord(row: any): ValidationResult {
    const errors = [];
    const warnings = [];
    
    if (!row.email || !this.isValidEmail(row.email)) {
      errors.push('Invalid email address');
    }
    
    if (!row.name || row.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!row.role || !['USER', 'ADMIN'].includes(row.role)) {
      warnings.push(`Unknown role: ${row.role}, defaulting to USER`);
      row.role = 'USER';
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
}
```

---

## 6. Production Deployment Checklist

### Azure Storage Setup ✅
- [x] Storage Account created: `usassetstoragedev`
- [x] Container created: `uploads`
- [x] Connection string stored in Key Vault
- [x] Public access disabled (security)

### Environment Configuration ✅
- [x] Local development: `.env` file with connection string
- [x] Production: Key Vault injection configured
- [x] Container name configurable via environment

### Security Considerations ✅
- [x] Files stored in private container (no public access)
- [x] Download URLs are time-limited signed URLs
- [x] File uploads validated (size, type restrictions)
- [x] Soft delete preserves audit trail

### Performance Optimization
- [ ] Add file size limits in controller (recommend 50MB max)
- [ ] Add supported file type validation
- [ ] Implement download URL caching
- [ ] Add file processing queue for large files

---

## 7. Common Use Cases

### User Bulk Import
1. Upload CSV with columns: `email,name,role`
2. Call processing endpoint: `POST /api/files/{id}/process-users`
3. System validates emails, checks duplicates, imports new users
4. Returns import summary with success/error counts

### Asset Inventory Import
1. Upload Excel with asset details
2. System validates asset categories, owner emails
3. Creates assets and assigns to owners
4. Generates import report

### Project Data Import
1. Upload CSV with project and member data
2. System creates projects and assigns members
3. Handles role assignments and permissions

---

## ✅ Implementation Status

### Completed Features
- [x] **File Upload API** - `POST /api/files` with Azure Blob Storage
- [x] **File Listing API** - `GET /api/files` with pagination 
- [x] **Download URLs** - `GET /api/files/:id/download` with secure URLs
- [x] **File Deletion** - `DELETE /api/files/:id` with soft delete
- [x] **Azure Infrastructure** - Storage Account, Key Vault integration
- [x] **Frontend Component** - Complete React component with MUI
- [x] **Database Schema** - File metadata with audit trail
- [x] **Environment Configuration** - Dev and production ready

### Next Steps (Future Enhancements)
1. **Create Processing Endpoints** - Specific endpoints for CSV/Excel processing
2. **Add Validation Pipeline** - Robust data validation before import
3. **Implement Background Jobs** - Queue-based processing for large files
4. **Add Progress Tracking** - WebSocket updates for long-running imports
5. **Create Import Templates** - Standard CSV templates for different data types

## 🚀 Azure Deployment - CRITICAL CORS Configuration

### ⚠️ CORS Setup for Azure (MUST DO THIS!)

When deploying to Azure, the backend CORS must allow the frontend Container App URL:

#### Backend CORS Configuration
```bash
# Update backend Container App with frontend URL
az containerapp update \
  --name backend-<unique> \
  --resource-group usasset-rg \
  --set-env-vars \
    CORS_ORIGIN="https://frontend-<unique>.azurecontainerapps.io" \
    AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string \
    AZURE_STORAGE_CONTAINER_NAME=uploads
```

The backend reads `CORS_ORIGIN` and automatically configures allowed origins in `main.ts`:
```typescript
// Backend automatically handles this:
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')  // Production: from env var
  : ['http://localhost:5173', ...];      // Development: localhost ports
```

### Frontend API URL Configuration

#### ⚠️ CRITICAL: Frontend MUST use full backend URL
The frontend API calls must use the complete backend URL, not relative paths:

**Build-time Configuration** (before building Docker image):
```bash
# In apps/frontend/.env.production
VITE_API_URL=https://backend-<unique>.azurecontainerapps.io
```

**Runtime Check**: Frontend uses this in `useFileOperations.ts`:
```typescript
const API_BASE = config.api.baseUrl;  // Gets VITE_API_URL
// Makes calls to: http://localhost:3000/api/files (dev)
// Makes calls to: https://backend-xxx.azurecontainerapps.io/api/files (prod)
```

### Complete Deployment Steps

1. **Deploy Backend First**
```bash
# Get your backend URL after deployment
BACKEND_URL=$(az containerapp show \
  --name backend-<unique> \
  --resource-group usasset-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

echo "Backend URL: https://$BACKEND_URL"
```

2. **Configure Frontend with Backend URL**
```bash
# Update frontend .env.production
echo "VITE_API_URL=https://$BACKEND_URL" > apps/frontend/.env.production

# Build frontend
cd apps/frontend
npm run build
docker build -t frontend:latest .
```

3. **Deploy Frontend and Get URL**
```bash
# Deploy and get frontend URL
FRONTEND_URL=$(az containerapp show \
  --name frontend-<unique> \
  --resource-group usasset-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

echo "Frontend URL: https://$FRONTEND_URL"
```

4. **Update Backend CORS with Frontend URL**
```bash
# THIS IS CRITICAL - Update backend to allow frontend
az containerapp update \
  --name backend-<unique> \
  --resource-group usasset-rg \
  --set-env-vars CORS_ORIGIN="https://$FRONTEND_URL"
```

### Verification Checklist
- [ ] Frontend `.env.production` has correct backend URL
- [ ] Backend `CORS_ORIGIN` env var has frontend URL
- [ ] Test CORS: `curl -I https://backend-xxx.azurecontainerapps.io/api/files -H "Origin: https://frontend-xxx.azurecontainerapps.io"`
- [ ] Navigate to frontend Files page and verify no CORS errors

## Troubleshooting

### Common Issues
- **CORS blocked errors**: Backend `CORS_ORIGIN` doesn't match frontend URL exactly
- **Network errors**: Frontend using relative URLs instead of full backend URL
- **File upload fails**: Check Azure storage connection string in Key Vault
- **Frontend can't reach backend**: Verify `VITE_API_URL` was set during build

### Debug Commands
```bash
# Check uploaded files in Azure
az storage blob list --container-name uploads --connection-string "..."

# Check database file records
psql -d usasset -c "SELECT id, original_name, processing_status FROM files ORDER BY created_at DESC LIMIT 10;"

# Test API endpoints
curl -X GET "http://localhost:3000/api/files"
```