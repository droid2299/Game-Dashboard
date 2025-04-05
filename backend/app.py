import os
from flask import Flask, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Folder containing your game installation files
GAME_DIR = r'C:\Games'

# RAWG API settings
RAWG_API_KEY = ''
RAWG_API_URL = 'https://api.rawg.io/api/games'

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
