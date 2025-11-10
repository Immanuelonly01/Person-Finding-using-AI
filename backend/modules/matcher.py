import numpy as np
from typing import Union, List

class Matcher:
    """
    Calculates cosine similarity between a target and reference embedding(s) using NumPy.
    Supports both single embeddings and lists of embeddings (returns best match).
    Optimized for ArcFace and FaceNet embeddings (L2-normalized).
    """
    
    # Default threshold for ArcFace embeddings (0.75+ for high accuracy)
    DEFAULT_THRESHOLD = 0.75 

    def __init__(self, threshold: float = DEFAULT_THRESHOLD):
        """
        Initializes the Matcher with a cosine similarity threshold.
        
        Args:
            threshold: Similarity threshold (0.0 to 1.0). 
                       Default 0.75 is recommended for ArcFace embeddings.
        """
        self.threshold = threshold

    def match(self, target_embedding: np.ndarray, reference_embedding: Union[np.ndarray, List[np.ndarray]]):
        """
        Compares target embedding against reference embedding(s).
        
        Args:
            target_embedding: L2-normalized embedding vector (1D numpy array)
            reference_embedding: Single embedding vector OR list of embedding vectors
            
        Returns:
            Tuple of (similarity_score: float, is_match: bool)
            If multiple references provided, returns the highest similarity score.
        """
        if target_embedding is None or target_embedding.size == 0:
            return 0.0, False
        
        # Ensure target is flat (1D vector)
        target_emb = target_embedding.flatten()
        
        # Handle both single embedding and list of embeddings
        if isinstance(reference_embedding, list):
            # Multiple reference embeddings - find best match
            best_similarity = -1.0
            for ref_emb in reference_embedding:
                if ref_emb is None or ref_emb.size == 0:
                    continue
                ref_flat = ref_emb.flatten()
                similarity = np.dot(target_emb, ref_flat)
                similarity = np.clip(similarity, -1.0, 1.0)
                best_similarity = max(best_similarity, similarity)
            
            if best_similarity < 0:
                return 0.0, False
            
            is_match = best_similarity >= self.threshold
            return best_similarity, is_match
        else:
            # Single reference embedding
            if reference_embedding is None or reference_embedding.size == 0:
                return 0.0, False
            
            ref_emb = reference_embedding.flatten()
            
            # Calculate cosine similarity using dot product
            # Since embeddings are L2-normalized, ||A|| = ||B|| = 1, so:
            # Cosine Similarity = A . B
            similarity = np.dot(target_emb, ref_emb)
            
            # Clip to theoretical range [-1.0, 1.0]
            similarity = np.clip(similarity, -1.0, 1.0)
            
            is_match = similarity >= self.threshold
            
            return similarity, is_match

# -------------------------------------------------------------
# NOTE: Update the initialization of your Matcher in config.py or app.py
# Example: 
# from similarity_matching.cosine_match import Matcher
# matcher = Matcher(threshold=0.68) # Using a slightly stricter threshold for security
# -------------------------------------------------------------