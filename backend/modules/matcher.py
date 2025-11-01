import numpy as np
# Removed: from sklearn.metrics.pairwise import cosine_similarity

class Matcher:
    """Calculates cosine similarity between a target and reference embedding using NumPy."""
    
    # Recommended default threshold for aligned FaceNet embeddings
    DEFAULT_THRESHOLD = 0.65 

    def __init__(self, threshold: float = DEFAULT_THRESHOLD):
        """
        Initializes the Matcher with a cosine similarity threshold.
        The default 0.65 is recommended for high-accuracy FaceNet (InceptionResnetV1) results.
        """
        self.threshold = threshold

    def match(self, target_embedding: np.ndarray, reference_embedding: np.ndarray):
        """
        Compares two L2-normalized FaceNet embeddings.
        Returns: (similarity_score: float, is_match: bool)
        """
        if target_embedding is None or reference_embedding is None or target_embedding.size == 0 or reference_embedding.size == 0:
            return 0.0, False
            
        # Ensure embeddings are flat (1D vectors)
        target_emb = target_embedding.flatten()
        ref_emb = reference_embedding.flatten()
        
        # Calculate cosine similarity using the dot product formula:
        # Cosine Similarity = (A . B) / (||A|| * ||B||)
        # Since FaceNet embeddings are L2-normalized (||A|| = 1 and ||B|| = 1), 
        # the denominator is 1, simplifying the calculation to just the dot product.
        similarity = np.dot(target_emb, ref_emb)
        
        # Clip the similarity score to stay within the theoretical range [-1.0, 1.0] 
        # due to potential floating-point errors, though it's usually unnecessary for L2-normed vectors.
        similarity = np.clip(similarity, -1.0, 1.0)
        
        is_match = similarity >= self.threshold
        
        return similarity, is_match

# -------------------------------------------------------------
# NOTE: Update the initialization of your Matcher in config.py or app.py
# Example: 
# from similarity_matching.cosine_match import Matcher
# matcher = Matcher(threshold=0.68) # Using a slightly stricter threshold for security
# -------------------------------------------------------------