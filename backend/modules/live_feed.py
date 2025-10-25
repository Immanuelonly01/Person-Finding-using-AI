import cv2, time
from .face_embedding import ArcFaceEmbedder
from .matcher import match
from config import THRESHOLD

def start_live_feed(ref_embeddings, device='cpu'):
    embedder = ArcFaceEmbedder(device=device)
    cap = cv2.VideoCapture(0)  # 0 for default webcam

    if not cap.isOpened():
        print("[ERROR] Could not open webcam")
        return

    print("[INFO] Starting live feed... Press 'q' to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        faces = embedder.model.get(frame)
        for f in faces:
            x1, y1, x2, y2 = map(int, f.bbox)
            probe_emb = f.embedding
            best_id, score, matched = match(ref_embeddings, probe_emb, THRESHOLD)

            if matched:
                label = f"{best_id} ({score:.2f})"
                color = (0, 255, 0)
            else:
                label = f"Unknown ({score:.2f})"
                color = (0, 0, 255)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        cv2.imshow("Live Face ID", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
