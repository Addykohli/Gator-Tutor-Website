#!/bin/bash
# ============================================================================
# Comprehensive Schedule & Booking System Test Script
# Tests all /schedule endpoints in logical scenarios
# ============================================================================

BASE_URL="http://127.0.0.1:8000"
TUTOR_ID=7      # Update based on available tutors in your DB
STUDENT_ID=1    # Update based on available students in your DB
TEST_DATE="2024-12-15"  # Use a future date

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
}

# Helper function to print test names
print_test() {
    echo -e "${YELLOW}TEST: $1${NC}"
    echo -e "${GREEN}$2${NC}"
    echo "----------------------------------------"
}

# Helper function to log response
log_response() {
    echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
    echo ""
}

# ============================================================================
print_header "SCHEDULE & BOOKING SYSTEM - FULL API TEST SUITE"
# ============================================================================

echo "Configuration:"
echo "  BASE_URL:   $BASE_URL"
echo "  TUTOR_ID:   $TUTOR_ID"
echo "  STUDENT_ID: $STUDENT_ID"
echo "  TEST_DATE:  $TEST_DATE"
echo ""

# ============================================================================
print_header "SCENARIO 1: AVAILABILITY SLOT MANAGEMENT (Tutor Setup)"
# ============================================================================

# Test 1.1: Get current availability slots (should be empty or existing)
print_test "1.1 - Get Current Availability Slots" \
           "GET /schedule/tutors/${TUTOR_ID}/availability-slots"

SLOTS_RESPONSE=$(curl -s "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots")
log_response "$SLOTS_RESPONSE"

# Test 1.2: Create availability slot for Monday 10am-2pm
print_test "1.2 - Create Availability Slot (Monday 10:00-14:00)" \
           "POST /schedule/tutors/${TUTOR_ID}/availability-slots"

SLOT1_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots" \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": 1,
    "start_time": "10:00:00",
    "end_time": "14:00:00",
    "location_mode": "online",
    "location_note": "Zoom link will be provided"
  }')

log_response "$SLOT1_RESPONSE"
SLOT1_ID=$(echo "$SLOT1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('slot_id', ''))" 2>/dev/null)
echo "Created Slot ID: ${SLOT1_ID}"
echo ""

# Test 1.3: Create another slot for Wednesday 9am-12pm
print_test "1.3 - Create Another Slot (Wednesday 09:00-12:00)" \
           "POST /schedule/tutors/${TUTOR_ID}/availability-slots"

SLOT2_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots" \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": 3,
    "start_time": "09:00:00",
    "end_time": "12:00:00",
    "location_mode": "campus",
    "location_note": "Library Room 201"
  }')

log_response "$SLOT2_RESPONSE"
SLOT2_ID=$(echo "$SLOT2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('slot_id', ''))" 2>/dev/null)
echo "Created Slot ID: ${SLOT2_ID}"
echo ""

# Test 1.4: Create a second Monday slot (afternoon) - Tests multi-slot per day
print_test "1.4 - Create Second Monday Slot (15:00-17:00) - Multi-slot per day" \
           "POST /schedule/tutors/${TUTOR_ID}/availability-slots"

SLOT3_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots" \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": 1,
    "start_time": "15:00:00",
    "end_time": "17:00:00",
    "location_mode": "online",
    "location_note": "Afternoon session"
  }')

log_response "$SLOT3_RESPONSE"
SLOT3_ID=$(echo "$SLOT3_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('slot_id', ''))" 2>/dev/null)
echo "Created Slot ID: ${SLOT3_ID}"
echo ""

# Test 1.5: Try to create overlapping slot (should FAIL)
print_test "1.5 - Try Creating OVERLAPPING Slot (Monday 11:00-13:00) - SHOULD FAIL" \
           "POST /schedule/tutors/${TUTOR_ID}/availability-slots"

OVERLAP_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots" \
  -H "Content-Type: application/json" \
  -d '{
    "weekday": 1,
    "start_time": "11:00:00",
    "end_time": "13:00:00",
    "location_mode": "online",
    "location_note": "This should fail - overlaps with 10-14"
  }')

log_response "$OVERLAP_RESPONSE"

# Test 1.6: Verify all slots created
print_test "1.6 - Verify All Slots Created" \
           "GET /schedule/tutors/${TUTOR_ID}/availability-slots"

ALL_SLOTS=$(curl -s "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots")
log_response "$ALL_SLOTS"

# Test 1.7: Update a slot (change times)
if [ ! -z "$SLOT1_ID" ] && [ "$SLOT1_ID" != "" ]; then
    print_test "1.7 - Update Slot ${SLOT1_ID} (Change to 10:00-15:00)" \
               "PUT /schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT1_ID}"

    UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT1_ID}" \
      -H "Content-Type: application/json" \
      -d '{
        "end_time": "15:00:00"
      }')

    log_response "$UPDATE_RESPONSE"
fi

# Test 1.8: Try updating with wrong tutor_id (should FAIL - authorization)
if [ ! -z "$SLOT2_ID" ] && [ "$SLOT2_ID" != "" ]; then
    print_test "1.8 - Try Updating Slot with WRONG Tutor ID - SHOULD FAIL" \
               "PUT /schedule/tutors/9999/availability-slots/${SLOT2_ID}"

    WRONG_TUTOR_RESPONSE=$(curl -s -X PUT "${BASE_URL}/schedule/tutors/9999/availability-slots/${SLOT2_ID}" \
      -H "Content-Type: application/json" \
      -d '{
        "location_note": "This should fail"
      }')

    log_response "$WRONG_TUTOR_RESPONSE"
fi

# ============================================================================
print_header "SCENARIO 2: STUDENT BOOKING FLOW"
# ============================================================================

# Test 2.1: Check availability for a specific date
print_test "2.1 - Check Tutor Availability for ${TEST_DATE}" \
           "GET /schedule/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}"

AVAIL_RESPONSE=$(curl -s "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}")
log_response "$AVAIL_RESPONSE"

# Test 2.2: Create a booking (pending status)
print_test "2.2 - Create Booking Request (Status: pending)" \
           "POST /schedule/bookings"

BOOKING_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"tutor_id\": ${TUTOR_ID},
    \"student_id\": ${STUDENT_ID},
    \"start_time\": \"${TEST_DATE}T10:00:00\",
    \"end_time\": \"${TEST_DATE}T11:00:00\",
    \"course_id\": 1,
    \"meeting_link\": \"https://zoom.us/j/test123\",
    \"notes\": \"Need help with Python recursion\"
  }")

log_response "$BOOKING_RESPONSE"
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('booking_id', ''))" 2>/dev/null)
echo "Created Booking ID: ${BOOKING_ID}"
echo ""

# Test 2.3: Create second booking for different time
print_test "2.3 - Create Second Booking Request (11:00-12:00)" \
           "POST /schedule/bookings"

BOOKING2_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"tutor_id\": ${TUTOR_ID},
    \"student_id\": ${STUDENT_ID},
    \"start_time\": \"${TEST_DATE}T11:00:00\",
    \"end_time\": \"${TEST_DATE}T12:00:00\",
    \"course_id\": 1,
    \"notes\": \"Follow-up session\"
  }")

log_response "$BOOKING2_RESPONSE"
BOOKING2_ID=$(echo "$BOOKING2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('booking_id', ''))" 2>/dev/null)
echo "Created Booking ID: ${BOOKING2_ID}"
echo ""

# Test 2.4: Try to double-book same slot (should FAIL)
print_test "2.4 - Try Double-Booking Same Slot - SHOULD FAIL" \
           "POST /schedule/bookings"

DOUBLE_BOOK_RESPONSE=$(curl -s -X POST "${BASE_URL}/schedule/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"tutor_id\": ${TUTOR_ID},
    \"student_id\": 2,
    \"start_time\": \"${TEST_DATE}T10:00:00\",
    \"end_time\": \"${TEST_DATE}T11:00:00\",
    \"course_id\": 1,
    \"notes\": \"This should fail - slot already booked\"
  }")

log_response "$DOUBLE_BOOK_RESPONSE"

# Test 2.5: Check availability again (booked slots should be gone)
print_test "2.5 - Check Availability Again (Booked slots should be gone)" \
           "GET /schedule/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}"

AVAIL_AFTER=$(curl -s "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}")
log_response "$AVAIL_AFTER"

# ============================================================================
print_header "SCENARIO 3: BOOKING QUERIES"
# ============================================================================

# Test 3.1: Get all bookings (no filter)
print_test "3.1 - Get All Bookings (No Filter)" \
           "GET /schedule/bookings"

ALL_BOOKINGS=$(curl -s "${BASE_URL}/schedule/bookings")
log_response "$ALL_BOOKINGS"

# Test 3.2: Get bookings by student
print_test "3.2 - Get Student's Bookings" \
           "GET /schedule/bookings?student_id=${STUDENT_ID}"

STUDENT_BOOKINGS=$(curl -s "${BASE_URL}/schedule/bookings?student_id=${STUDENT_ID}")
log_response "$STUDENT_BOOKINGS"

# Test 3.3: Get bookings by tutor
print_test "3.3 - Get Tutor's Bookings" \
           "GET /schedule/bookings?tutor_id=${TUTOR_ID}"

TUTOR_BOOKINGS=$(curl -s "${BASE_URL}/schedule/bookings?tutor_id=${TUTOR_ID}")
log_response "$TUTOR_BOOKINGS"

# Test 3.4: Get pending bookings only
print_test "3.4 - Get Pending Bookings Only" \
           "GET /schedule/bookings?tutor_id=${TUTOR_ID}&status=pending"

PENDING_BOOKINGS=$(curl -s "${BASE_URL}/schedule/bookings?tutor_id=${TUTOR_ID}&status=pending")
log_response "$PENDING_BOOKINGS"

# Test 3.5: Get bookings via student-specific endpoint
print_test "3.5 - Get Student Bookings (Dedicated Endpoint)" \
           "GET /schedule/bookings/student/${STUDENT_ID}"

STUDENT_ENDPOINT=$(curl -s "${BASE_URL}/schedule/bookings/student/${STUDENT_ID}")
log_response "$STUDENT_ENDPOINT"

# Test 3.6: Get bookings via tutor-specific endpoint
print_test "3.6 - Get Tutor Bookings (Dedicated Endpoint)" \
           "GET /schedule/bookings/tutor/${TUTOR_ID}"

TUTOR_ENDPOINT=$(curl -s "${BASE_URL}/schedule/bookings/tutor/${TUTOR_ID}")
log_response "$TUTOR_ENDPOINT"

# ============================================================================
print_header "SCENARIO 4: TUTOR APPROVAL FLOW"
# ============================================================================

# Test 4.1: Tutor approves first booking
if [ ! -z "$BOOKING_ID" ] && [ "$BOOKING_ID" != "" ]; then
    print_test "4.1 - Tutor Approves Booking ${BOOKING_ID}" \
               "PUT /schedule/bookings/${BOOKING_ID}/status"

    APPROVE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/schedule/bookings/${BOOKING_ID}/status" \
      -H "Content-Type: application/json" \
      -d "{
        \"status\": \"confirmed\",
        \"tutor_id\": ${TUTOR_ID}
      }")

    log_response "$APPROVE_RESPONSE"
fi

# Test 4.2: Tutor rejects second booking
if [ ! -z "$BOOKING2_ID" ] && [ "$BOOKING2_ID" != "" ]; then
    print_test "4.2 - Tutor Rejects Booking ${BOOKING2_ID}" \
               "PUT /schedule/bookings/${BOOKING2_ID}/status"

    REJECT_RESPONSE=$(curl -s -X PUT "${BASE_URL}/schedule/bookings/${BOOKING2_ID}/status" \
      -H "Content-Type: application/json" \
      -d "{
        \"status\": \"cancelled\",
        \"tutor_id\": ${TUTOR_ID}
      }")

    log_response "$REJECT_RESPONSE"
fi

# Test 4.3: Try to update booking with wrong tutor (should FAIL)
if [ ! -z "$BOOKING_ID" ] && [ "$BOOKING_ID" != "" ]; then
    print_test "4.3 - Try Updating Booking with WRONG Tutor - SHOULD FAIL" \
               "PUT /schedule/bookings/${BOOKING_ID}/status"

    WRONG_TUTOR_BOOKING=$(curl -s -X PUT "${BASE_URL}/schedule/bookings/${BOOKING_ID}/status" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "cancelled",
        "tutor_id": 9999
      }')

    log_response "$WRONG_TUTOR_BOOKING"
fi

# Test 4.4: Try invalid status value (should FAIL)
if [ ! -z "$BOOKING_ID" ] && [ "$BOOKING_ID" != "" ]; then
    print_test "4.4 - Try Invalid Status Value - SHOULD FAIL" \
               "PUT /schedule/bookings/${BOOKING_ID}/status"

    INVALID_STATUS=$(curl -s -X PUT "${BASE_URL}/schedule/bookings/${BOOKING_ID}/status" \
      -H "Content-Type: application/json" \
      -d "{
        \"status\": \"invalid_status\",
        \"tutor_id\": ${TUTOR_ID}
      }")

    log_response "$INVALID_STATUS"
fi

# Test 4.5: Verify booking statuses after updates
print_test "4.5 - Verify Confirmed Bookings" \
           "GET /schedule/bookings?tutor_id=${TUTOR_ID}&status=confirmed"

CONFIRMED=$(curl -s "${BASE_URL}/schedule/bookings?tutor_id=${TUTOR_ID}&status=confirmed")
log_response "$CONFIRMED"

print_test "4.6 - Verify Cancelled Bookings" \
           "GET /schedule/bookings?tutor_id=${TUTOR_ID}&status=cancelled"

CANCELLED=$(curl -s "${BASE_URL}/schedule/bookings?tutor_id=${TUTOR_ID}&status=cancelled")
log_response "$CANCELLED"

# Test 4.7: Check availability after cancellation (cancelled slot should be available again)
print_test "4.7 - Check Availability After Cancellation (11:00-12:00 should be available)" \
           "GET /schedule/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}"

AVAIL_AFTER_CANCEL=$(curl -s "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability?date=${TEST_DATE}")
log_response "$AVAIL_AFTER_CANCEL"

# ============================================================================
print_header "SCENARIO 5: CLEANUP - DELETE AVAILABILITY SLOTS"
# ============================================================================

# Test 5.1: Delete first slot
if [ ! -z "$SLOT1_ID" ] && [ "$SLOT1_ID" != "" ]; then
    print_test "5.1 - Delete Availability Slot ${SLOT1_ID}" \
               "DELETE /schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT1_ID}"

    DELETE1_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT1_ID}")
    log_response "$DELETE1_RESPONSE"
fi

# Test 5.2: Try deleting with wrong tutor (should FAIL)
if [ ! -z "$SLOT2_ID" ] && [ "$SLOT2_ID" != "" ]; then
    print_test "5.2 - Try Deleting Slot with WRONG Tutor - SHOULD FAIL" \
               "DELETE /schedule/tutors/9999/availability-slots/${SLOT2_ID}"

    DELETE_WRONG=$(curl -s -X DELETE "${BASE_URL}/schedule/tutors/9999/availability-slots/${SLOT2_ID}")
    log_response "$DELETE_WRONG"
fi

# Test 5.3: Delete remaining slots
if [ ! -z "$SLOT2_ID" ] && [ "$SLOT2_ID" != "" ]; then
    print_test "5.3 - Delete Slot ${SLOT2_ID}" \
               "DELETE /schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT2_ID}"

    DELETE2_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT2_ID}")
    log_response "$DELETE2_RESPONSE"
fi

if [ ! -z "$SLOT3_ID" ] && [ "$SLOT3_ID" != "" ]; then
    print_test "5.4 - Delete Slot ${SLOT3_ID}" \
               "DELETE /schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT3_ID}"

    DELETE3_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots/${SLOT3_ID}")
    log_response "$DELETE3_RESPONSE"
fi

# Test 5.5: Verify all slots deleted
print_test "5.5 - Verify All Slots Deleted" \
           "GET /schedule/tutors/${TUTOR_ID}/availability-slots"

FINAL_SLOTS=$(curl -s "${BASE_URL}/schedule/tutors/${TUTOR_ID}/availability-slots")
log_response "$FINAL_SLOTS"

# ============================================================================
print_header "TEST SUITE COMPLETE"
# ============================================================================

echo "Summary of Created Resources:"
echo "  - Slot 1 ID:    ${SLOT1_ID:-'N/A'}"
echo "  - Slot 2 ID:    ${SLOT2_ID:-'N/A'}"
echo "  - Slot 3 ID:    ${SLOT3_ID:-'N/A'}"
echo "  - Booking 1 ID: ${BOOKING_ID:-'N/A'}"
echo "  - Booking 2 ID: ${BOOKING2_ID:-'N/A'}"
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Note: Bookings created during testing remain in the database."
echo "      You may want to clean them up manually if needed."
echo ""
