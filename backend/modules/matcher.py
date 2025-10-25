import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def cosine_sim(a, b):
    return float(cosine_similarity(a.reshape(1, -1), b.reshape(1, -1))[0][0])

def match(ref_embeddings, probe_embedding, threshold=0.45):
    best_id, best_score = None, -1
    for ref_id, emb in ref_embeddings.items():
        score = cosine_sim(emb, probe_embedding)
        if score > best_score:
            best_score = score
            best_id = ref_id
    return best_id, best_score, best_score >= threshold
