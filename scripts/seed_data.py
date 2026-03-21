#!/usr/bin/env python3
"""
Comprehensive Test Data Generator for Appointments 360
"""

import requests
import json
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"

def get_token(email, password):
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def create_user(email, password, first_name, last_name, role, phone, dni):
    """Create a new user"""
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "firstName": first_name,
        "lastName": last_name,
        "role": role,
        "phone": phone,
        "dni": dni
    })
    return response

def main():
    print("="*60)
    print("COMPREHENSIVE TEST DATA GENERATOR")
    print("="*60)
    
    # Get admin token
    admin_token = get_token("admin@test.com", "123456")
    if not admin_token:
        print("❌ Failed to authenticate as admin")
        return
    
    print("✓ Authenticated as admin")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create additional professionals
    print("\n" + "="*60)
    print("1. CREATING ADDITIONAL PROFESSIONALS")
    print("="*60)
    
    import random
    base_phone = 5550000000
    
    professionals = [
        ("dr.sarah.johnson@clinic.com", "Dr. Sarah", "Johnson", f"+{base_phone + random.randint(1000, 9999)}", "DOC-002"),
        ("dr.michael.brown@clinic.com", "Dr. Michael", "Brown", f"+{base_phone + random.randint(1000, 9999)}", "DOC-003"),
        ("dr.emily.davis@clinic.com", "Dr. Emily", "Davis", f"+{base_phone + random.randint(1000, 9999)}", "DOC-004"),
    ]
    
    prof_ids = []
    for email, first, last, phone, dni in professionals:
        response = create_user(email, "123456", first, last, "PROFESSIONAL", phone, dni)
        if response.status_code in [200, 201]:
            data = response.json()
            prof_ids.append(data["user"]["id"])
            print(f"✓ Created {first} {last}")
        elif response.status_code == 409:
            # User already exists, get their ID
            print(f"⚠ {email} already exists")
        else:
            print(f"❌ Failed to create {email}: {response.status_code} - {response.text}")
    
    # 2. Create additional patients
    print("\n" + "="*60)
    print("2. CREATING ADDITIONAL PATIENTS")
    print("="*60)
    
    patients = [
        ("alice.wonder@email.com", "Alice", "Wonder", f"+{base_phone + random.randint(1000, 9999)}", "PAT-001"),
        ("bob.builder@email.com", "Bob", "Builder", f"+{base_phone + random.randint(1000, 9999)}", "PAT-002"),
        ("charlie.chocolate@email.com", "Charlie", "Chocolate", f"+{base_phone + random.randint(1000, 9999)}", "PAT-003"),
        ("diana.prince@email.com", "Diana", "Prince", f"+{base_phone + random.randint(1000, 9999)}", "PAT-004"),
        ("eve.online@email.com", "Eve", "Online", f"+{base_phone + random.randint(1000, 9999)}", "PAT-005"),
    ]
    
    patient_ids = []
    for email, first, last, phone, dni in patients:
        response = create_user(email, "123456", first, last, "PATIENT", phone, dni)
        if response.status_code in [200, 201]:
            data = response.json()
            patient_ids.append(data["user"]["id"])
            print(f"✓ Created {first} {last}")
        elif response.status_code == 409:
            print(f"⚠ {email} already exists")
        else:
            print(f"❌ Failed to create {email}: {response.status_code} - {response.text}")
    
    # 3. Get existing professionals and patients
    print("\n" + "="*60)
    print("3. FETCHING EXISTING USERS")
    print("="*60)
    
    # Get all professionals
    response = requests.get(f"{BASE_URL}/auth/users?role=PROFESSIONAL", headers=headers)
    if response.status_code == 200:
        all_professionals = response.json()
        print(f"✓ Found {len(all_professionals)} professionals")
    else:
        print(f"❌ Failed to get professionals: {response.status_code}")
        all_professionals = []
    
    # Get all patients
    response = requests.get(f"{BASE_URL}/auth/users?role=PATIENT", headers=headers)
    if response.status_code == 200:
        all_patients = response.json()
        print(f"✓ Found {len(all_patients)} patients")
    else:
        print(f"❌ Failed to get patients: {response.status_code}")
        all_patients = []
    
    # 4. Generate slots for all professionals
    print("\n" + "="*60)
    print("4. GENERATING SLOTS")
    print("="*60)
    
    dates = [(datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, 8)]
    
    for prof in all_professionals[:3]:  # First 3 professionals
        for date in dates[:3]:  # Next 3 days
            response = requests.post(
                f"{BASE_URL}/slots/generate",
                headers=headers,
                json={
                    "professionalId": prof["id"],
                    "startDate": date,
                    "endDate": date
                }
            )
            if response.status_code == 201:
                print(f"✓ Slots for {prof['profile']['firstName']} on {date}")
            else:
                print(f"⚠ Slots may already exist for {prof['profile']['firstName']} on {date}")
    
    # 5. Create appointments with various statuses
    print("\n" + "="*60)
    print("5. CREATING APPOINTMENTS")
    print("="*60)
    
    if len(all_professionals) >= 2 and len(all_patients) >= 5:
        prof1, prof2 = all_professionals[0], all_professionals[1]
        
        # Create PENDING appointments
        for i in range(3):
            if i < len(all_patients):
                # Get available slot
                date = dates[0]
                slot_resp = requests.get(
                    f"{BASE_URL}/slots/available/{prof1['id']}?date={date}",
                    headers=headers
                )
                if slot_resp.status_code == 200 and slot_resp.json()["slots"]:
                    slot_id = slot_resp.json()["slots"][0]["id"]
                    
                    response = requests.post(
                        f"{BASE_URL}/appointments",
                        headers=headers,
                        json={
                            "patientId": all_patients[i]["id"],
                            "professionalId": prof1["id"],
                            "slotId": slot_id,
                            "notes": f"Test appointment {i+1} - PENDING"
                        }
                    )
                    if response.status_code == 201:
                        print(f"✓ Created PENDING appointment {i+1}")
        
        # Create CONFIRMED appointments
        for i in range(2):
            idx = i + 3
            if idx < len(all_patients):
                date = dates[1]
                slot_resp = requests.get(
                    f"{BASE_URL}/slots/available/{prof2['id']}?date={date}",
                    headers=headers
                )
                if slot_resp.status_code == 200 and slot_resp.json()["slots"]:
                    slot_id = slot_resp.json()["slots"][0]["id"]
                    
                    response = requests.post(
                        f"{BASE_URL}/appointments",
                        headers=headers,
                        json={
                            "patientId": all_patients[idx]["id"],
                            "professionalId": prof2["id"],
                            "slotId": slot_id,
                            "notes": f"Test appointment {i+1} - CONFIRMED"
                        }
                    )
                    if response.status_code == 201:
                        appt_id = response.json()["id"]
                        # Confirm it
                        requests.patch(
                            f"{BASE_URL}/appointments/{appt_id}/status",
                            headers=headers,
                            json={"status": "CONFIRMED"}
                        )
                        print(f"✓ Created CONFIRMED appointment {i+1}")
    
    # 6. Create strikes
    print("\n" + "="*60)
    print("6. CREATING STRIKES")
    print("="*60)
    
    if len(all_professionals) >= 2 and len(all_patients) >= 3:
        # Get professional token
        prof_token = get_token("doctor@test.com", "123456")
        if prof_token:
            prof_headers = {"Authorization": f"Bearer {prof_token}"}
            
            # Create strikes
            strikes_data = [
                (all_patients[0]["id"], "Patient arrived 30 minutes late without notice"),
                (all_patients[1]["id"], "No show for scheduled appointment - third occurrence"),
                (all_patients[2]["id"], "Patient was disrespectful to medical staff"),
            ]
            
            for patient_id, reason in strikes_data:
                response = requests.post(
                    f"{BASE_URL}/strikes",
                    headers=prof_headers,
                    json={
                        "patientId": patient_id,
                        "reason": reason
                    }
                )
                if response.status_code == 201:
                    print(f"✓ Created strike for patient")
                else:
                    print(f"⚠ Could not create strike: {response.status_code}")
    
    # 7. Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✓ Total Professionals: {len(all_professionals)}")
    print(f"✓ Total Patients: {len(all_patients)}")
    print("\nTest Accounts:")
    print("  Admin: admin@test.com / 123456")
    print("  Doctor: doctor@test.com / 123456")
    print("  Dr. Sarah: dr.sarah.johnson@clinic.com / 123456")
    print("  Dr. Michael: dr.michael.brown@clinic.com / 123456")
    print("  Dr. Emily: dr.emily.davis@clinic.com / 123456")
    print("\nPatients:")
    print("  patient@test.com / 123456")
    print("  patient2@test.com / 123456")
    print("  alice.wonder@email.com / 123456")
    print("  bob.builder@email.com / 123456")
    print("  charlie.chocolate@email.com / 123456")
    print("\n" + "="*60)
    print("✓ COMPREHENSIVE TEST DATA CREATED!")
    print("="*60)

if __name__ == "__main__":
    main()
