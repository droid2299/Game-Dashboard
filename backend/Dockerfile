# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app code
COPY . .

# Expose port 3000 (as defined in app.py)
EXPOSE 3000

# Run the Flask application
CMD ["python", "app.py"]
