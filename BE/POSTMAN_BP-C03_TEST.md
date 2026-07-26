# Postman Test Guide - BP-C03 (Teacher Knowledge Base)

Tai lieu nay huong dan test cac API BP-C03 da tao trong backend.

## 1) Chuan bi

- Chay backend:
  - `npm run dev`
- Co 1 tai khoan role `TEACHER` trong DB.
- Co `courseId` hop le va teacher da duoc gan vao `teacherIds` cua course.
- Neu muon test callback internal co bao mat token:
  - set env `INTERNAL_API_TOKEN` trong backend.

## 2) Tao Postman Environment

Tao environment ten: `OJT-KNS-SU26-BE`

Variables de xuat:

- `baseUrl` = `http://localhost:3000`
- `teacherEmail` = `teacher@academy.edu`
- `teacherPassword` = `123456`
- `accessToken` = (de trong, se set sau login)
- `courseId` = (dien tay)
- `documentId` = (de trong, se set sau upload)
- `internalApiToken` = (neu backend co set `INTERNAL_API_TOKEN`)

## 3) Auth - Lay access token

### Request: Login teacher

- Method: `POST`
- URL: `{{baseUrl}}/api/auth/login`
- Body (raw JSON):

```json
{
  "email": "{{teacherEmail}}",
  "password": "{{teacherPassword}}"
}
```

Expected:

- Status: `200`
- Co field `accessToken`.

Postman Tests tab (de auto luu token):

```javascript
const data = pm.response.json();
if (data.accessToken) {
  pm.environment.set("accessToken", data.accessToken);
}
```

## 4) BP-C03 API Test Cases

### 4.1 Upload document (Teacher)

- Method: `POST`
- URL: `{{baseUrl}}/api/teacher/courses/{{courseId}}/documents`
- Headers:
  - `Authorization: Bearer {{accessToken}}`
- Body: `form-data`
  - key `file` (type File): chon file `.pdf` hoac `.docx` hoac `.txt`
  - key `title` (Text): `Aircraft Safety Manual`
  - key `version` (Text): `v1.0`
  - key `description` (Text): `Tai lieu an toan bay co ban`

Expected:

- Status: `201`
- `document.status` thuong la:
  - `processing` (khi AI request accepted)
  - hoac `failed` (khi AI service loi)
- Co `document.id`.

Postman Tests tab (de auto luu documentId):

```javascript
const data = pm.response.json();
if (data.document && data.document.id) {
  pm.environment.set("documentId", data.document.id);
}
```

### 4.2 List documents by course

- Method: `GET`
- URL: `{{baseUrl}}/api/teacher/courses/{{courseId}}/documents`
- Headers:
  - `Authorization: Bearer {{accessToken}}`

Optional filter:

- URL: `{{baseUrl}}/api/teacher/courses/{{courseId}}/documents?status=processing`

Expected:

- Status: `200`
- Tra ve `documents` la mang.

### 4.3 Get document detail

- Method: `GET`
- URL: `{{baseUrl}}/api/teacher/documents/{{documentId}}`
- Headers:
  - `Authorization: Bearer {{accessToken}}`

Expected:

- Status: `200`
- Tra ve object `document` day du metadata + status.

### 4.4 Reindex document

- Method: `POST`
- URL: `{{baseUrl}}/api/teacher/documents/{{documentId}}/reindex`
- Headers:
  - `Authorization: Bearer {{accessToken}}`

Expected:

- Status: `200`
- Neu dang `processing` se co the tra `409`.
- Neu submit thanh cong, `document.status` -> `processing`.

### 4.5 Internal callback update status (AI -> Backend)

- Method: `POST`
- URL: `{{baseUrl}}/api/internal/ai/documents/{{documentId}}/status`
- Headers:
  - `Content-Type: application/json`
  - Neu backend co set token bao mat:
    - `x-internal-token: {{internalApiToken}}`
- Body (raw JSON):

```json
{
  "status": "active"
}
```

Hoac truong hop fail:

```json
{
  "status": "failed",
  "errorMessage": "Embedding generation failed"
}
```

Expected:

- Status: `200`
- `document.status` duoc cap nhat theo body.

## 5) Negative Tests quan trong

### 5.1 Thieu token

- Goi endpoint teacher khong gui `Authorization`.
- Expected: `401`.

### 5.2 Sai role (Student goi API teacher)

- Dang nhap bang user role STUDENT va goi API teacher.
- Expected: `403`.

### 5.3 Teacher khong duoc gan vao course

- Teacher hop le nhung khong nam trong `course.teacherIds`.
- Expected: `403`.

### 5.4 Sai dinh dang file

- Upload file khong thuoc whitelist (vd `.exe`).
- Expected: `400` + message unsupported file type.

### 5.5 Vuot qua 10MB

- Upload file > 10MB.
- Expected: `400`.

### 5.6 Sai status callback

- Callback voi status khong nam trong danh sach hop le.
- Expected: `400`.

## 6) Danh sach status tai lieu

- `uploaded`: vua luu metadata/file
- `processing`: da gui index sang AI, dang xu ly
- `active`: index thanh cong, san sang phuc vu hoi dap
- `failed`: xu ly/index loi
- `inactive`: tai lieu tam ngung su dung

## 7) Thu tu test de xuat (nhanh)

1. Login teacher -> lay `accessToken`.
2. Upload document -> lay `documentId`.
3. List documents -> kiem tra co document moi.
4. Get detail -> check metadata + status.
5. Reindex -> verify status doi.
6. Callback internal -> doi sang `active`/`failed`.
7. Chay 2-3 negative tests de xac nhan auth/validation.

## 8) Troubleshooting nhanh

- Loi `401 Invalid or expired authentication token`:
  - Login lai de lay token moi.
- Loi `403 You are not assigned to this course`:
  - Kiem tra `teacherIds` cua course.
- Loi callback `401 Unauthorized internal callback`:
  - Kiem tra `x-internal-token` va env `INTERNAL_API_TOKEN`.
- Upload fail do file type:
  - Chi dung PDF, DOCX, TXT.
