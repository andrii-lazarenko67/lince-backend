# File Upload System Documentation

## Overview

The LINCE file upload system uses two different storage providers based on file type:

- **Images** (Inspections, Incidents) → **Cloudinary**
- **Documents** (Library) → **Google Cloud Storage (GCS)**

## Architecture

### Configuration Files

1. **`.env`** - Contains all credentials
   ```env
   # Cloudinary (for images)
   CLOUDINARY_CLOUD_NAME=dcfjvxt5h
   CLOUDINARY_API_KEY=541445981138132
   CLOUDINARY_API_SECRET=nQ_dj1uLkdVITmP1aVh4FWMlMCY

   # Google Cloud Storage (for documents)
   GCS_PROJECT_ID=tidal-cipher-470316-r1
   GCS_BUCKET_NAME=lince-documents
   GCS_CLIENT_EMAIL=<service_account_email>
   GCS_PRIVATE_KEY=<service_account_private_key>
   ```

2. **`src/config/cloudinary.js`** - Cloudinary configuration
3. **`src/config/googleCloudStorage.js`** - GCS configuration

### Middleware

**`src/middlewares/upload.js`** - Multer middleware for handling file uploads
- Uses memory storage (no local disk writes)
- File size limit: 10MB
- Allowed image types: JPEG, PNG, GIF, WEBP
- Allowed document types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV

### Utilities

1. **`src/utils/cloudinaryUpload.js`** - Cloudinary upload/delete utilities
   - `uploadToCloudinary(buffer, folder, resourceType)` - Upload file to Cloudinary
   - `deleteFromCloudinary(publicId, resourceType)` - Delete file from Cloudinary
   - `uploadMultipleToCloudinary(files, folder, resourceType)` - Upload multiple files

2. **`src/utils/gcsUpload.js`** - Google Cloud Storage upload/delete utilities
   - `uploadToGCS(buffer, folder, originalFilename)` - Upload file to GCS
   - `deleteFromGCS(filename)` - Delete file from GCS

### Service Layer

**`src/services/uploadService.js`** - Unified upload service
- `uploadImage(buffer, folder)` - Upload image to Cloudinary
- `uploadDocument(buffer, folder, originalFilename)` - Upload document to GCS
- `deleteImage(publicId)` - Delete image from Cloudinary
- `deleteDocument(filename)` - Delete document from GCS

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

**Upload Document:**
```javascript
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
  publicId: result.public_id,
  uploadedBy
});
```

**Delete Document:**
```javascript
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
  publicId: STRING(200), -- Cloudinary public ID
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
  fileUrl: STRING(500),   -- GCS public URL
  fileType: STRING(50),
  fileSize: INTEGER,
  publicId: STRING(200),  -- GCS filename (path in bucket)
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
2. Get Cloud Name, API Key, API Secret from dashboard
3. Add credentials to `.env` file

### Google Cloud Storage Setup
1. Create project in Google Cloud Console
2. Create storage bucket (e.g., `lince-documents`)
3. Create service account with Storage Admin role
4. Download service account JSON key
5. Add credentials to `.env` file:
   - `GCS_PROJECT_ID` - From service account JSON
   - `GCS_BUCKET_NAME` - Your bucket name
   - `GCS_CLIENT_EMAIL` - From service account JSON
   - `GCS_PRIVATE_KEY` - From service account JSON (replace \n with actual newlines)

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

- Monitor Cloudinary usage dashboard for image storage limits
- Monitor GCS console for bucket size and costs
- Regularly clean up unused/deleted files
- Update credentials when they expire or are compromised
