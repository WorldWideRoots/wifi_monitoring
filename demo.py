import requests
import json
from datetime import datetime

# Define SevOne API details
SEVONE_API_URL = 'https://your-sevone-instance/api/v1'
USERNAME = 'your_username'
PASSWORD = 'your_password'
AUTH_ENDPOINT = f'{SEVONE_API_URL}/auth/login'

# Function to authenticate and get the API token
def authenticate():
    response = requests.post(AUTH_ENDPOINT, json={"username": USERNAME, "password": PASSWORD})
    response.raise_for_status()  # Raise an exception for HTTP errors
    data = response.json()
    return data['token']

# Function to pull WiFi device data
def pull_wifi_data(token):
    headers = {'Authorization': f'Bearer {token}'}
    endpoint = f'{SEVONE_API_URL}/wifi_devices'
    response = requests.get(endpoint, headers=headers)
    response.raise_for_status()
    return response.json()

# Authenticate and get the API token
token = authenticate()

# Pull WiFi device data
wifi_data = pull_wifi_data(token)

# Print the WiFi device data
print(json.dumps(wifi_data, indent=2))
