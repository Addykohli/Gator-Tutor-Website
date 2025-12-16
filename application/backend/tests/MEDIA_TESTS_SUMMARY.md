# Media Handling Tests Summary

## Test Files Created

### 1. `test_media_handling.py`
Unit tests for the media handling service module.

**Test Coverage:**
- File categorization (photos, videos, PDFs)
- Subdirectory generation
- File saving with proper path generation
- File deletion
- Path validation
- Integration flow tests

**Run Tests:**
```bash
cd application/backend
source .venv/bin/activate
pytest tests/test_media_handling.py -v
```

**Test Results:** ✅ All 23 tests passing

### 2. `test_chat_media_api.py`
Integration tests for chat media API endpoints.

**Test Coverage:**
- Media upload via `/api/chat/send-media`
- File type categorization in API
- Database storage verification
- Chat history with media

**Run Tests:**
```bash
cd application/backend
source .venv/bin/activate
pytest tests/test_chat_media_api.py -v
```

### 3. `test_media_curl.sh`
Automated curl test script for manual API testing.

**Run Script:**
```bash
cd application/backend
bash tests/test_media_curl.sh
```

## Manual cURL Testing

### Start Backend Server

```bash
cd application/backend
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Test 1: Upload Image

```bash
# Create test file
echo "fake image content" > /tmp/test_image.jpg

# Upload
curl -X POST "http://localhost:8000/api/chat/send-media?user_id=1" \
  -F "file=@/tmp/test_image.jpg" \
  -F "receiver_id=2" \
  -F "content=Test image" \
  -v

# Expected: Returns JSON with media_path like "/media/photos/chat/{uuid}.jpg"
```

### Test 2: Upload PDF

```bash
echo "%PDF-1.4 test" > /tmp/test.pdf

curl -X POST "http://localhost:8000/api/chat/send-media?user_id=1" \
  -F "file=@/tmp/test.pdf" \
  -F "receiver_id=2" \
  -F "content=Test PDF"

# Expected: media_path should be "/media/pdfs/chat/{uuid}.pdf"
```

### Test 3: Upload Video

```bash
echo "fake video" > /tmp/test.mp4

curl -X POST "http://localhost:8000/api/chat/send-media?user_id=1" \
  -F "file=@/tmp/test.mp4" \
  -F "receiver_id=2" \
  -F "content=Test video"

# Expected: media_path should be "/media/videos/chat/{uuid}.mp4"
```

### Test 4: Get Chat History

```bash
curl "http://localhost:8000/api/chat/chatroomhistory/1/2" | jq

# Should include messages with media_path fields
```

### Test 5: Verify File on Server

After upload, check file exists on server:

```bash
# SSH to server
ssh -i ~/.ssh/csc648-team-08-key.pem ubuntu@3.101.155.82

# Check file exists (replace {uuid} with actual UUID from response)
ls -la /home/atharva/media/photos/chat/{uuid}.jpg
```

### Test 6: Access via Nginx (on server)

```bash
# On server, test nginx serving
curl http://localhost/media/photos/chat/{uuid}.jpg

# Or from local machine (if domain configured)
curl http://your-domain.com/media/photos/chat/{uuid}.jpg
```

## Test Results

### Unit Tests
- ✅ 23/23 tests passing
- ✅ File categorization working
- ✅ Path generation correct
- ✅ File operations working

### Integration Tests
- Ready to run (requires backend server)

### cURL Tests
- Script created and ready
- Manual commands documented

## Next Steps

1. Start backend server
2. Run curl test script: `bash tests/test_media_curl.sh`
3. Verify files are saved to correct directories
4. Test nginx serving files at `/media/` route
5. Verify frontend can access files

