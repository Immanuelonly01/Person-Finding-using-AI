# check_camera.py
import cv2
import time

print("Attempting to open camera...")
# Try opening the default camera (index 0)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("🔴 FAIL: Camera index 0 failed to open.")
    # Try index 1 just in case (some laptops use index 1 for the main cam)
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        print("🔴 FAIL: Camera index 1 also failed. OpenCV cannot detect a camera.")
        print("ACTION: Ensure no other app (Zoom, Teams, etc.) is using the camera.")
        exit()

print("🟢 SUCCESS: Camera opened. Capturing frame...")

# Read a single frame
ret, frame = cap.read()
if ret:
    print(f"🟢 SUCCESS: Frame size received: {frame.shape}")
    
    # Optional: Display the frame briefly to visually confirm (requires screen access)
    cv2.imshow('Camera Test (Close Window to Exit)', frame)
    cv2.waitKey(2000) # Wait 2 seconds
    cv2.destroyAllWindows()
else:
    print("🔴 FAIL: Could not read frame.")

cap.release()
print("Test complete.")