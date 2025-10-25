# D:\Projects\Final Year Project\Deploy\run_server.py

import os
import sys

# 1. Add the project root to the system path to allow 'backend' package imports
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 2. Import the Flask application instance directly
try:
    # Flask application instance is named 'app' inside backend/app.py
    from backend.app import app
except ImportError as e:
    print(f"FATAL ERROR: Could not load Flask application from backend.app: {e}")
    print("Please ensure your files are in the correct backend/ directory structure and all imports in backend/app.py are absolute.")
    sys.exit(1)

# 3. Run the Flask application
if __name__ == '__main__':
    print("✅ Launching server using run_server.py...")
    # app.run() will now correctly use the configuration loaded from the backend package
    app.run(debug=True, host='0.0.0.0', port=5000)