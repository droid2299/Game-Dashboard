import os
from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from ctransformers import AutoModelForCausalLM
import torch

app = Flask(__name__)
CORS(app)

# Folder containing your game installation files
GAME_DIR = r'C:\Games'

# RAWG API settings
RAWG_API_KEY = ''
RAWG_API_URL = 'https://api.rawg.io/api/games'

# Load your pre-trained model.
# The model and model file used here are the same as in the KDnuggets guide.
MODEL_NAME = "TheBloke/Llama-2-7B-Chat-GGML"
MODEL_FILE = "llama-2-7b-chat.ggmlv3.q4_K_S.bin"

# Load the model on CPU.
llm = AutoModelForCausalLM.from_pretrained(MODEL_NAME, model_file=MODEL_FILE)

import re
from typing import List

def extract_game_names(response_text: str) -> List[str]:
    """
    Extract game names from LLM response text using multiple heuristics.
    
    This function first attempts to extract names from lines that start with 
    numbered or bullet list markers. It then splits the line on common separators 
    (e.g., hyphen) to isolate the game title. If no matches are found, it falls 
    back to searching for a "Suggested Games:" section and splits that text.
    """
    game_names = set()  # Use set to avoid duplicates.
    # Split the response into lines.
    lines = response_text.splitlines()

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Heuristic 1: Look for numbered list patterns (e.g., "1. Game Name - Description").
        num_match = re.match(r'^\d+\s*(?:[.)])\s*(.+)$', line)
        if num_match:
            content = num_match.group(1)
            # If a hyphen or dash is present, assume text before it is the title.
            if '-' in content:
                name_part = content.split('-', 1)[0].strip()
            else:
                name_part = content.strip()
            if name_part:
                game_names.add(name_part)
            continue

        # Heuristic 2: Look for bullet point list patterns (e.g., "- Game Name - Description" or "* Game Name: Description").
        bullet_match = re.match(r'^[*-]\s+(.+)$', line)
        if bullet_match:
            content = bullet_match.group(1)
            # Split on common separators if present.
            if '-' in content:
                name_part = content.split('-', 1)[0].strip()
            elif ':' in content:
                name_part = content.split(':', 1)[0].strip()
            else:
                name_part = content.strip()
            if name_part:
                game_names.add(name_part)
            continue

    # Fallback: Look for a section starting with "Suggested Games:" and extract comma-separated names.
    if not game_names:
        fallback_match = re.search(r'Suggested Games:\s*(.+)', response_text, re.IGNORECASE)
        if fallback_match:
            games_str = fallback_match.group(1)
            # Attempt to split by comma or newline in case of multiple entries.
            parts = re.split(r',|\n', games_str)
            for part in parts:
                name = part.strip().strip('"').strip()
                if name:
                    game_names.add(name)
                    
    return list(game_names)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query', '')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    # Generate LLM response using streaming
    response_text = ""
    for token in llm(query, stream=True):
        response_text += token

    # Print the LLM response for debugging
    print("LLM Response:")
    print(response_text)

    # Extract game names from the LLM response
    game_names = extract_game_names(response_text)
    print("Extracted game names:", game_names)

    # Retrieve RAWG API metadata for each extracted game name
    rawg_data = []
    for name in game_names:
        metadata = fetch_game_metadata(name)
        print(f"RAWG API output for '{name}':", metadata)
        rawg_data.append({
            "game_name": name,
            "metadata": metadata
        })

    # Return both the LLM response and the RAWG API data
    json_response = jsonify({
        "response": response_text,
        "rawg_data": rawg_data
    })
    return json_response

def fetch_game_metadata(game_search_term: str) -> dict:
    try:
        # First, search for the game
        params = {
            'search': game_search_term,
            'key': RAWG_API_KEY,
            'page_size': 1
        }
        response = requests.get(RAWG_API_URL, params=params)
        response.raise_for_status()
        results = response.json().get('results', [])
        
        if results:
            game = results[0]
            game_id = game.get('id')
            # Now, request full game details including description fields
            details_url = f"{RAWG_API_URL}/{game_id}"
            details_params = {'key': RAWG_API_KEY}
            details_response = requests.get(details_url, params=details_params)
            details_response.raise_for_status()
            details = details_response.json()
            # Merge the full details into the basic game info
            game.update(details)
            return game
        else:
            return {}
    except Exception as e:
        app.logger.error(f"Error fetching metadata for '{game_search_term}': {e}")
        return {}

@app.route('/api/games', methods=['GET'])
def get_games():
    try:
        files = os.listdir(GAME_DIR)
    except Exception as e:
        app.logger.error(f"Error reading game directory: {e}")
        return jsonify({'error': 'Could not access game directory'}), 500

    # Filter files as needed (here we simply list all files)
    game_files = [f for f in files if f.lower()]

    games = []
    for file in game_files:
        game_identifier, _ = os.path.splitext(file)
        metadata = fetch_game_metadata(game_identifier)
        # Get primary and additional background images
        logo = metadata.get('background_image')
        bg = metadata.get('background_image_additional') or logo

        games.append({
            'name': metadata.get('name') or game_identifier.capitalize(),
            'file': file,
            'logo': logo,
            'bg': bg,
            'released': metadata.get('released'),
            'rating': metadata.get('rating'),
            'metacritic': metadata.get('metacritic'),
            'playtime': metadata.get('playtime'),
            'platforms': metadata.get('platforms'),
            'genres': metadata.get('genres'),
            'tags': metadata.get('tags'),
            'esrb_rating': metadata.get('esrb_rating'),
            'website': metadata.get('website'),
            'description': metadata.get('description_raw', ''),
            # Extra images: RAWG returns a list of screenshots under 'short_screenshots'
            'screenshots': metadata.get('short_screenshots')
        })

    return jsonify(games)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)
