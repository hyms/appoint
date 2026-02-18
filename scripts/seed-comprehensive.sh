# Comprehensive Test Data for Appointments 360
# This script creates test data for all system functions

set -e

echo "=========================================="
echo "Creating Comprehensive Test Data"
echo "=========================================="

# Get tokens
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"123456"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
PROF_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"doctor@test.com","password":"123456"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✓ Got authentication tokens"

# Function to generate UUID
generate_uuid() {
    uuidgen
}

echo ""
echo "=========================================="
echo "1. CREATING ADDITIONAL PROFESSIONALS"
echo "=========================================="

# Create professional 2
PROF2_ID=$(generate_uuid)
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"doctor2@test.com\",
    \"password\": \"123456\",
    \"firstName\": \"Maria\",
    \"lastName\": \"Garcia\",
    \"phone\": \"+1234567892\",
    \"role\": \"PROFESSIONAL\",
    \"dni\": \"12345679C\"
  }" > /dev/null

echo "✓ Created Dr. Maria Garcia (ID: $PROF2_ID)"

# Create professional 3  
PROF3_ID=$(generate_uuid)
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"doctor3@test.com\",
    \"password\": \"123456\",
    \"firstName\": \"Carlos\",
    \"lastName\": \"Lopez\",
    \"phone\": \"+1234567893\",
    \"role\": \"PROFESSIONAL\",
    \"dni\": \"12345680D\"
  }" > /dev/null

echo "✓ Created Dr. Carlos Lopez (ID: $PROF3_ID)"

echo ""
echo "=========================================="
echo "2. CREATING ADDITIONAL PATIENTS"
echo "=========================================="

PATIENT_UUIDS=()

for i in {3..8}; do
    PATIENT_ID=$(generate_uuid)
    PATIENT_UUIDS+=($PATIENT_ID)
    
    curl -s -X POST http://localhost:3000/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"patient$i@test.com\",
        \"password\": \"123456\",
        \"firstName\": \"Patient\",
        \"lastName\": \"Number$i\",
        \"phone\": \"+11111111$i\",
        \"role\": \"PATIENT\",
        \"dni\": \"9999999$i\"
      }" > /dev/null
    
    echo "✓ Created patient$i@test.com"
done

echo ""
echo "=========================================="
echo "3. CREATING LOCATIONS"
echo "=========================================="

# Create location 1
LOC1_ID=$(generate_uuid)
curl -s -X POST http://localhost:3000/locations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Main Clinic\",
    \"address\": \"123 Main Street, City Center\",
    \"phone\": \"+1234567890\"
  }" > /dev/null

echo "✓ Created Main Clinic"

# Create location 2
LOC2_ID=$(generate_uuid)
curl -s -X POST http://localhost:3000/locations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Branch Office North\",
    \"address\": \"456 North Avenue, North District\",
    \"phone\": \"+1234567891\"
  }" > /dev/null

echo "✓ Created Branch Office North"

echo ""
echo "=========================================="
echo "4. GENERATING SLOTS"
echo "=========================================="

# Generate slots for multiple professionals and dates
PROF_IDS=($PROF2_ID $PROF3_ID)
DATES=("2026-02-20" "2026-02-21" "2026-02-22" "2026-02-23" "2026-02-24")

for prof_id in "${PROF_IDS[@]}"; do
    for date in "${DATES[@]}"; do
        curl -s -X POST http://localhost:3000/slots/generate \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"professionalId\": \"$prof_id\",
            \"startDate\": \"$date\",
            \"endDate\": \"$date\"
          }" > /dev/null
    done
    echo "✓ Generated slots for professional $prof_id"
done

echo ""
echo "=========================================="
echo "5. CREATING APPOINTMENTS WITH VARIOUS STATUSES"
echo "=========================================="

# Book some appointments
get_available_slot() {
    local prof_id=$1
    local date=$2
    curl -s "http://localhost:3000/slots/available/$prof_id?date=$date" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slots'][0]['id'])"
}

# Create PENDING appointments
echo "Creating PENDING appointments..."
for i in {0..2}; do
    SLOT_ID=$(get_available_slot "${PROF_IDS[0]}" "${DATES[0]}")
    PATIENT_ID=${PATIENT_UUIDS[$i]}
    
    curl -s -X POST http://localhost:3000/appointments \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"patientId\": \"$PATIENT_ID\",
        \"professionalId\": \"${PROF_IDS[0]}\",
        \"slotId\": \"$SLOT_ID\",
        \"notes\": \"Pending appointment for testing\"
      }" > /dev/null
done
echo "✓ Created 3 PENDING appointments"

# Create CONFIRMED appointments
echo "Creating CONFIRMED appointments..."
for i in {3..4}; do
    SLOT_ID=$(get_available_slot "${PROF_IDS[1]}" "${DATES[1]}")
    PATIENT_ID=${PATIENT_UUIDS[$i]}
    
    APPT=$(curl -s -X POST http://localhost:3000/appointments \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"patientId\": \"$PATIENT_ID\",
        \"professionalId\": \"${PROF_IDS[1]}\",
        \"slotId\": \"$SLOT_ID\",
        \"notes\": \"Confirmed appointment for testing\"
      }")
    
    APPT_ID=$(echo $APPT | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    # Confirm the appointment
    curl -s -X PATCH "http://localhost:3000/appointments/$APPT_ID/status" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "CONFIRMED"}' > /dev/null
done
echo "✓ Created 2 CONFIRMED appointments"

# Create COMPLETED appointments
echo "Creating COMPLETED appointments..."
SLOT_ID=$(get_available_slot "${PROF_IDS[0]}" "${DATES[2]}")
APPT=$(curl -s -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"${PATIENT_UUIDS[0]}\",
    \"professionalId\": \"${PROF_IDS[0]}\",
    \"slotId\": \"$SLOT_ID\",
    \"notes\": \"Completed appointment test\"
  }")

APPT_ID=$(echo $APPT | grep -o '"id":"[^"]*' | cut -d'"' -f4)
curl -s -X PATCH "http://localhost:3000/appointments/$APPT_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}' > /dev/null
echo "✓ Created 1 COMPLETED appointment"

# Create CANCELLED appointments
echo "Creating CANCELLED appointments..."
SLOT_ID=$(get_available_slot "${PROF_IDS[1]}" "${DATES[3]}")
APPT=$(curl -s -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"${PATIENT_UUIDS[1]}\",
    \"professionalId\": \"${PROF_IDS[1]}\",
    \"slotId\": \"$SLOT_ID\",
    \"notes\": \"Cancelled appointment test\"
  }")

APPT_ID=$(echo $APPT | grep -o '"id":"[^"]*' | cut -d'"' -f4)
curl -s -X POST "http://localhost:3000/appointments/$APPT_ID/cancel" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Patient requested cancellation"}' > /dev/null
echo "✓ Created 1 CANCELLED appointment"

echo ""
echo "=========================================="
echo "6. CREATING ADDITIONAL STRIKES"
echo "=========================================="

# Get professional 2 token
PROF2_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"doctor2@test.com","password":"123456"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Create strikes from different professionals
echo "Creating strikes from Dr. Maria Garcia..."
curl -s -X POST http://localhost:3000/strikes \
  -H "Authorization: Bearer $PROF2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"${PATIENT_UUIDS[2]}\",
    \"reason\": \"Patient arrived 45 minutes late and demanded immediate service. Disrupted schedule.\"
  }" > /dev/null

curl -s -X POST http://localhost:3000/strikes \
  -H "Authorization: Bearer $PROF2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"${PATIENT_UUIDS[3]}\",
    \"reason\": \"No show for appointment. No prior notice given. Second occurrence.\"
  }" > /dev/null

echo "✓ Created 2 strikes from Dr. Maria Garcia"

echo "Creating strikes from Dr. Carlos Lopez..."
PROF3_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"doctor3@test.com","password":"123456"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST http://localhost:3000/strikes \
  -H "Authorization: Bearer $PROF3_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"${PATIENT_UUIDS[4]}\",
    \"reason\": \"Patient was disrespectful to staff. Violated clinic policies.\"
  }" > /dev/null

echo "✓ Created 1 strike from Dr. Carlos Lopez"

echo ""
echo "=========================================="
echo "7. CREATING PAYMENTS"
echo "=========================================="

# Create some appointments with payments
echo "Creating appointments with payment records..."

# Get first professional's ID
FIRST_PROF=$(curl -s http://localhost:3000/auth/users?role=PROFESSIONAL -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'])")

for i in {0..2}; do
    DATE="2026-02-$((20 + i))"
    SLOT_ID=$(get_available_slot "$FIRST_PROF" "$DATE")
    
    APPT=$(curl -s -X POST http://localhost:3000/appointments \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"patientId\": \"${PATIENT_UUIDS[$i]}\",
        \"professionalId\": \"$FIRST_PROF\",
        \"slotId\": \"$SLOT_ID\",
        \"notes\": \"Appointment with payment\"
      }")
    
    APPT_ID=$(echo $APPT | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    # Generate payment QR
    curl -s -X POST http://localhost:3000/payments/generate \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"appointmentId\": \"$APPT_ID\"}" > /dev/null
done
echo "✓ Created 3 appointments with payment QRs"

echo ""
echo "=========================================="
echo "8. CREATING EMERGENCY SCENARIOS"
echo "=========================================="

# Create emergency activation
curl -s -X POST http://localhost:3000/emergency/activate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Medical emergency - Dr. Smith unavailable due to family emergency",
    "startDate": "2026-02-20",
    "endDate": "2026-02-22"
  }' > /dev/null

echo "✓ Created emergency activation"

# Then deactivate
curl -s -X POST http://localhost:3000/emergency/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Dr. Smith has returned and normal operations resumed"}' > /dev/null

echo "✓ Resolved emergency"

echo ""
echo "=========================================="
echo "9. CREATING NOTIFICATION SETTINGS"
echo "=========================================="

curl -s -X PATCH http://localhost:3000/notification-settings \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailFrom": "noreply@appointments360.com",
    "emailFromName": "Appointments 360",
    "smsEnabled": true,
    "twilioPhoneNumber": "+1234567890",
    "whatsappEnabled": false,
    "telegramEnabled": true,
    "notifyAppointmentReminder": true,
    "notifyAppointmentConfirmation": true,
    "notifyAppointmentCancellation": true,
    "reminderHoursBefore": 24
  }' > /dev/null

echo "✓ Created notification settings"

echo ""
echo "=========================================="
echo "10. SUMMARY"
echo "=========================================="

# Count everything
echo "Professionals: 3 (Dr. John Doe, Dr. Maria Garcia, Dr. Carlos Lopez)"
echo "Patients: 8 total"
echo "Locations: 2 (Main Clinic, Branch Office North)"
echo "Appointments: Multiple with various statuses"
echo "Strikes: 5 total across different professionals"
echo "Payments: 3 with QR codes generated"
echo "Emergency: 1 activated and resolved"

echo ""
echo "=========================================="
echo "✓ TEST DATA CREATION COMPLETE!"
echo "=========================================="
echo ""
echo "Test Users:"
echo "  Admin: admin@test.com / 123456"
echo "  Doctor 1: doctor@test.com / 123456"
echo "  Doctor 2: doctor2@test.com / 123456"
echo "  Doctor 3: doctor3@test.com / 123456"
echo "  Patients: patient@test.com through patient8@test.com / 123456"
