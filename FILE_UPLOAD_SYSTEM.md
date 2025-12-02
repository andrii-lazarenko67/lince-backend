# File Upload System Documentation

## Overview

The LINCE file upload system uses **Cloudinary** for all file uploads:

- **Images** (Inspections, Incidents) → **Cloudinary** (resource_type: 'image')
- **Documents** (Library) → **Cloudinary** (resource_type: 'raw')

## Architecture

### Configuration Files

1. **`.env`** - Contains Cloudinary credentials
   ```env
   # Cloudinary (for all file uploads - images and documents)
   CLOUDINARY_CLOUD_NAME=dcfjvxt5h
   CLOUDINARY_API_KEY=541445981138132
   CLOUDINARY_API_SECRET=nQ_dj1uLkdVITmP1aVh4FWMlMCY
   ```

2. **`src/config/cloudinary.js`** - Cloudinary configuration

### Middleware

**`src/middlewares/upload.js`** - Multer middleware for handling file uploads
- Uses memory storage (no local disk writes)
- File size limit: 10MB
- Allowed image types: JPEG, PNG, GIF, WEBP
- Allowed document types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV

### Utilities

**`src/utils/cloudinaryUpload.js`** - Cloudinary upload/delete utilities
- `uploadToCloudinary(buffer, folder, resourceType)` - Upload file to Cloudinary
- `deleteFromCloudinary(publicId, resourceType)` - Delete file from Cloudinary
- `uploadMultipleToCloudinary(files, folder, resourceType)` - Upload multiple files

### Service Layer

**`src/services/uploadService.js`** - Unified upload service (all files use Cloudinary)
- `uploadImage(buffer, folder)` - Upload image to Cloudinary (resource_type: 'image')
- `uploadDocument(buffer, folder, originalFilename)` - Upload document to Cloudinary (resource_type: 'raw')
- `deleteImage(publicId)` - Delete image from Cloudinary
- `deleteDocument(publicId)` - Delete document from Cloudinary
- `uploadFile(buffer, folder, resourceType)` - Generic upload with custom resource type

## Usage in Controllers

### Inspections Controller

**Upload Photos:**
```javascript
if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    const result = await uploadService.uploadImage(file.buffer, 'inspections');
    await InspectionPhoto.create({
      inspectionId: inspection.id,
      url: result.secure_url,
      publicId: result.public_id,
      caption: ''
    });
  }
}
```

**Delete Photos:**
```javascript
for (const photo of inspection.photos) {
  if (photo.publicId) {
    await uploadService.deleteImage(photo.publicId);
  }
}
```

### Incidents Controller

**Upload Photos:**
```javascript
if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    const result = await uploadService.uploadImage(file.buffer, 'incidents');
    await IncidentPhoto.create({
      incidentId: incident.id,
      url: result.secure_url,
      publicId: result.public_id,
      caption: ''
    });
  }
}
```

**Delete Photos:**
```javascript
for (const photo of incident.photos) {
  if (photo.publicId) {
    await uploadService.deleteImage(photo.publicId);
  }
}
```

### Library Controller

**Upload Document (PDF, DOC, etc. to Cloudinary):**
```javascript
// Upload file to Cloudinary
const result = await uploadService.uploadDocument(
  req.file.buffer,
  'documents',
  req.file.originalname
);

const document = await Document.create({
  title,
  description,
  category,
  systemId: systemId || null,
  fileName: req.file.originalname,
  fileUrl: result.secure_url,
  fileType: req.file.mimetype,
  fileSize: req.file.size,
  publicId: result.public_id, // Cloudinary public ID
  uploadedBy
});
```

**Delete Document:**
```javascript
// Delete from Cloudinary
if (document.publicId) {
  await uploadService.deleteDocument(document.publicId);
}
```

## API Routes

### Inspections

- `POST /api/inspections` - Create inspection with photos (multipart/form-data)
  - Field: `photos` (multiple files, max 10)

- `POST /api/inspections/:id/photos` - Add photos to existing inspection
  - Field: `photos` (multiple files, max 10)

### Incidents

- `POST /api/incidents` - Create incident with photos (multipart/form-data)
  - Field: `photos` (multiple files, max 10)

- `POST /api/incidents/:id/photos` - Add photos to existing incident
  - Field: `photos` (multiple files, max 10)

### Library

- `POST /api/library` - Upload document (multipart/form-data)
  - Field: `file` (single file)
  - Fields: `title`, `description`, `category`, `systemId` (optional)

## Database Schema

### InspectionPhotos / IncidentPhotos
```sql
{
  id: INTEGER,
  inspectionId/incidentId: INTEGER,
  url: STRING(500),      -- Cloudinary URL
  publicId: STRING(200), -- Cloudinary public ID (for deletion)
  caption: STRING(255)
}
```

### Documents
```sql
{
  id: INTEGER,
  title: STRING(200),
  description: TEXT,
  category: STRING(50),
  systemId: INTEGER,
  fileName: STRING(255),
  fileUrl: STRING(500),   -- Cloudinary URL
  fileType: STRING(50),
  fileSize: INTEGER,
  publicId: STRING(200),  -- Cloudinary public ID (for deletion)
  uploadedBy: INTEGER,
  version: INTEGER,
  isActive: BOOLEAN
}
```

## Frontend Integration (To Be Implemented)

### Example: Upload Inspection Photos

```typescript
// Redux slice action
export const createInspection = createAsyncThunk(
  'inspections/create',
  async (inspectionData: CreateInspectionData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('systemId', inspectionData.systemId);
      formData.append('date', inspectionData.date);
      formData.append('conclusion', inspectionData.conclusion);
      formData.append('items', JSON.stringify(inspectionData.items));

      // Append photos
      inspectionData.photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.post('/inspections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
```

### Example: Upload Library Document

```typescript
// Redux slice action
export const uploadDocument = createAsyncThunk(
  'library/upload',
  async (documentData: UploadDocumentData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('title', documentData.title);
      formData.append('description', documentData.description);
      formData.append('category', documentData.category);
      if (documentData.systemId) {
        formData.append('systemId', documentData.systemId);
      }

      const response = await api.post('/library', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
```

## Error Handling

All upload functions handle errors gracefully:

1. **Invalid file type** - Multer middleware rejects with 400 error
2. **File too large** - Multer middleware rejects with 413 error (>10MB)
3. **Upload failure** - Service throws descriptive error
4. **Delete failure** - Service logs error and throws

## Security Considerations

1. **Authentication** - All upload routes protected by `authMiddleware`
2. **Authorization** - Library uploads restricted to managers/admins via `roleMiddleware`
3. **File validation** - File types validated by multer middleware
4. **Size limits** - 10MB maximum file size
5. **Credentials** - All credentials stored in `.env` file (never committed to git)

## Setup Instructions

### Cloudinary Setup
1. Create account at https://cloudinary.com
2. Go to Dashboard → Account Details
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Add credentials to `.env` file:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Cloudinary Features Used
- **Image Upload**: `resource_type: 'image'` - For JPEG, PNG, GIF, WEBP
- **Document Upload**: `resource_type: 'raw'` - For PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
- **Folders**: Files organized in folders (`lince/inspections`, `lince/incidents`, `lince/documents`)
- **Public URLs**: All uploaded files get secure public URLs
- **Transformation**: Cloudinary supports image transformations (resize, crop, format conversion)

## Testing

Test each endpoint with tools like Postman or curl:

```bash
# Upload inspection with photos
curl -X POST http://localhost:5000/api/inspections \
  -H "Authorization: Bearer <token>" \
  -F "systemId=1" \
  -F "date=2025-01-15" \
  -F "conclusion=All good" \
  -F "items=[...]" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"

# Upload library document
curl -X POST http://localhost:5000/api/library \
  -H "Authorization: Bearer <token>" \
  -F "title=Safety Manual" \
  -F "description=Pool safety procedures" \
  -F "category=manual" \
  -F "file=@manual.pdf"
```

## Maintenance

- Monitor Cloudinary usage dashboard for storage limits
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month
- Regularly clean up unused/deleted files
- Update credentials when they expire or are compromised
- Consider Cloudinary's auto-backup feature for critical files

## Benefits of Using Cloudinary Only

1. **Simplicity**: Single provider for all file types
2. **Cost-effective**: Free tier covers most small to medium projects
3. **No Complex Setup**: No service accounts or OAuth required
4. **Built-in CDN**: Fast global delivery
5. **Easy Management**: Single dashboard for all files
6. **Transformations**: Support for image optimization and transformations
7. **Backup**: Cloudinary handles redundancy and backups
