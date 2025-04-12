import os
import json
import numpy as np
import faiss
import torch
from transformers import AutoTokenizer, AutoModel

# Path to your local game metadata (a JSON file with a list of game dicts)
GAME_METADATA_FILE = "games_metadata.json"

# Load your game metadata
with open(GAME_METADATA_FILE, "r") as f:
    games = json.load(f)

# Use a larger embedding model, for example "hkunlp/instructor-xl"
embed_tokenizer = AutoTokenizer.from_pretrained("hkunlp/instructor-xl")
embed_model = AutoModel.from_pretrained("hkunlp/instructor-xl")
embed_model.eval()
embed_model.to("cpu")

def get_embedding(text):
    inputs = embed_tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        # Call only the encoder to obtain embeddings.
        encoder_outputs = embed_model.encoder(**inputs)
    emb = encoder_outputs.last_hidden_state.mean(dim=1)
    return emb.cpu().numpy()[0]



# Create embeddings for each game (using the description or combine title and description)
embeddings = []
for game in games:
    text = game.get("description", "") or game.get("name", "")
    emb = get_embedding(text)
    embeddings.append(emb)

embeddings = np.stack(embeddings)
d = embeddings.shape[1]

# Build FAISS index
index = faiss.IndexFlatL2(d)
index.add(embeddings)

# Save the index and the mapping
faiss.write_index(index, "games.index")
with open("games_mapping.json", "w") as f:
    json.dump(games, f)

print("Feature store built and saved.")
