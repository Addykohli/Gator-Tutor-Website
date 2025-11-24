#!/bin/bash
# Comprehensive Booking System Test Script
# Run this after database backup is complete

BASE_URL="http://127.0.0.1:8000"
TUTOR_ID=7  # Update this based on available tutors
STUDENT_ID=1  # Update this based on available students
TEST_DATE="2024-12-15"  # Use a future date

echo "=========================================="
echo "Booking System Test Suite"
echo "=========================================="
echo ""

# Test 1: Check Available Slots
echo "TEST 1: Check Available Slots for Tutor"
echo "----------------------------------------"
echo "GET /search/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}"
echo ""
curl -s "${BASE_URL}/search/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}" | python3 -m json.tool
echo ""
echo ""

# Test 2: Book an Available Slot (creates pending booking)
echo "TEST 2: Create a Booking (should be pending)"
echo "----------------------------------------"
echo "POST /search/bookings"
echo ""
BOOKING_RESPONSE=$(curl -s -X POST "${BASE_URL}/search/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"tutor_id\": ${TUTOR_ID},
    \"student_id\": ${STUDENT_ID},
    \"start_time\": \"${TEST_DATE}T10:00:00\",
    \"end_time\": \"${TEST_DATE}T11:00:00\",
    \"course_id\": 1,
    \"meeting_link\": \"https://zoom.us/j/test123\",
    \"notes\": \"Test booking for approval flow\"
  }")

echo "$BOOKING_RESPONSE" | python3 -m json.tool

# Extract booking_id from response
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['booking_id'])" 2>/dev/null)
echo ""
echo "Created Booking ID: ${BOOKING_ID}"
echo ""

# Test 3: Check Status of Created Booking
echo "TEST 3: Verify Booking Status (should be 'pending')"
echo "----------------------------------------"
echo "GET /search/bookings?tutor_id=${TUTOR_ID}&status=pending"
echo ""
curl -s "${BASE_URL}/search/bookings?tutor_id=${TUTOR_ID}&status=pending" | python3 -m json.tool
echo ""
echo ""

# Test 4: Check Availability Again (slot should be unavailable now)
echo "TEST 4: Check Availability Again (slot should be unavailable)"
echo "----------------------------------------"
echo "GET /search/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}"
echo ""
curl -s "${BASE_URL}/search/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}" | python3 -m json.tool
echo ""
echo ""

# Test 5: Retrieve Only Pending Bookings
echo "TEST 5: Retrieve Only Pending Bookings"
echo "----------------------------------------"
echo "GET /search/bookings?tutor_id=${TUTOR_ID}&status=pending"
echo ""
curl -s "${BASE_URL}/search/bookings?tutor_id=${TUTOR_ID}&status=pending" | python3 -m json.tool
echo ""
echo ""

# Test 6: Tutor Approves/Confirms the Booking
if [ ! -z "$BOOKING_ID" ]; then
  echo "TEST 6: Tutor Approves Booking (status: pending -> confirmed)"
  echo "----------------------------------------"
  echo "PUT /search/bookings/${BOOKING_ID}/status"
  echo ""
  APPROVE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/search/bookings/${BOOKING_ID}/status" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"confirmed\",
      \"tutor_id\": ${TUTOR_ID}
    }")
  
  echo "$APPROVE_RESPONSE" | python3 -m json.tool
  echo ""
  echo ""
fi

# Test 7: Retrieve Only Confirmed Bookings
echo "TEST 7: Retrieve Only Confirmed Bookings"
echo "----------------------------------------"
echo "GET /search/bookings?tutor_id=${TUTOR_ID}&status=confirmed"
echo ""
curl -s "${BASE_URL}/search/bookings?tutor_id=${TUTOR_ID}&status=confirmed" | python3 -m json.tool
echo ""
echo ""

# Test 8: Verify Pending List is Empty (if we approved the only pending)
echo "TEST 8: Verify Pending List (should not contain approved booking)"
echo "----------------------------------------"
echo "GET /search/bookings?tutor_id=${TUTOR_ID}&status=pending"
echo ""
curl -s "${BASE_URL}/search/bookings?tutor_id=${TUTOR_ID}&status=pending" | python3 -m json.tool
echo ""
echo ""

# Test 9: Check All Bookings for Tutor
echo "TEST 9: Get All Bookings for Tutor (no status filter)"
echo "----------------------------------------"
echo "GET /search/bookings?tutor_id=${TUTOR_ID}"
echo ""
curl -s "${BASE_URL}/search/bookings?tutor_id=${TUTOR_ID}" | python3 -m json.tool
echo ""
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="

