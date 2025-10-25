from flask import Flask, jsonify
from modules.utils import load_reference_embeddings
from modules.live_feed import start_live_feed
from config import DEVICE

app = Flask(__name__)

@app.route("/start_live", methods=["GET"])
def start_live():
    ref_emb = load_reference_embeddings()
    if not ref_emb:
        return jsonify({"status":"error","message":"No reference images found"}), 400

    start_live_feed(ref_emb, device=DEVICE)
    return jsonify({"status":"done"})

if __name__ == "__main__":
    app.run(debug=True)
