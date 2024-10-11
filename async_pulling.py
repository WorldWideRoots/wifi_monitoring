import asyncio
import aiohttp
import csv
import json
from datetime import datetime

# Async function to pull total device count
async def fetch_device_count(session, url):
    async with session.get(url) as response:
        data = await response.json()
        return data['device_count']

# Async function to pull device list in batches
async def fetch_device_list(session, url, offset):
    async with session.get(url, params={'offset': offset, 'limit': 500}) as response:
        return await response.json()

# Async function to pull health data in batches
async def fetch_device_health(session, url, offset):
    async with session.get(url, params={'offset': offset, 'limit': 500}) as response:
        return await response.json()

# Async function to pull detailed info for each device
async def fetch_device_detail(session, url, device_id):
    async with session.get(f"{url}/{device_id}") as response:
        return await response.json()

# Save raw data to CSV
def save_raw_data_to_csv(device_id, raw_data):
    with open('raw_data.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([device_id, raw_data])

# Save processed data to CSV
def save_processed_data_to_csv(processed_data):
    with open('processed_data.csv', mode='a', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=processed_data.keys())
        writer.writerow(processed_data)

# Save device count to file
def save_device_count_to_file(count):
    with open('device_count.json', mode='w') as file:
        json.dump({"device_count": count, "timestamp": str(datetime.now())}, file)

# Load device count from file
def load_device_count_from_file():
    try:
        with open('device_count.json', mode='r') as file:
            data = json.load(file)
            return data['device_count']
    except FileNotFoundError:
        return 1800  # Default value if no file is found

# Save device list to CSV
def save_device_list_to_csv(device_list):
    with open('device_list.csv', mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['device_id', 'device_name', 'device_type'])  # Adjust fields as needed
        writer.writeheader()
        for device in device_list:
            writer.writerow(device)

# Filter devices where 'reachabilityHealth' is 'DOWN'
def filter_down_devices(device_data):
    return [device for device in device_data if device.get('reachabilityHealth') == 'DOWN']

# Task for pulling the total device count and device list every 24 hours
async def pull_device_count_and_list_every_24hrs(http_session):
    device_count_url = "http://api.device3.com/get_device_count"
    device_list_url = "http://api.device3.com/get_device_list"
    
    while True:
        # Step 1: Get the total device count
        device_count = await fetch_device_count(http_session, device_count_url)
        save_device_count_to_file(device_count)
        print(f"Updated device count: {device_count}")
        
        # Step 2: Get the full device list in batches
        full_device_list = []
        for offset in range(0, device_count, 500):  # Call API in batches of 500 devices
            device_list = await fetch_device_list(http_session, device_list_url, offset)
            full_device_list.extend(device_list)  # Collect all devices across batches
        
        # Step 3: Save the complete device list to CSV
        save_device_list_to_csv(full_device_list)
        print(f"Device list updated, total devices: {len(full_device_list)}")

        await asyncio.sleep(24 * 60 * 60)  # Sleep for 24 hours

# Task for pulling device health and processing data every 15 minutes
async def pull_every_15min(http_session):
    while True:
        # Load the latest device count from the file
        total_devices = load_device_count_from_file()

        # Step 1: Pull device health data in batches based on total_devices
        base_url_health = "http://api.device3.com/device_health"
        down_devices = []
        for offset in range(0, total_devices, 500):  # Call API in batches of 500 devices
            raw_health_data = await fetch_device_health(http_session, base_url_health, offset)
            save_raw_data_to_csv(f"batch_offset_{offset}", raw_health_data)
            
            # Step 2: Filter devices with 'reachabilityHealth' = 'DOWN'
            down_devices += filter_down_devices(raw_health_data)

        # Step 3: Call detail API for filtered devices, limit 100 calls per minute
        base_url_detail = "http://api.device3.com/device_detail"
        for i in range(0, len(down_devices), 100):  # Process 100 devices per minute
            tasks = [
                fetch_device_detail(http_session, base_url_detail, device['device_id'])
                for device in down_devices[i:i+100]
            ]
            device_details = await asyncio.gather(*tasks)

            # Save processed device details
            for device in device_details:
                processed_data = process_data(device)
                save_processed_data_to_csv(processed_data)

            await asyncio.sleep(60)  # Respect API limit (100 calls/min)

        await asyncio.sleep(15 * 60)  # Sleep for 15 minutes

# Example function to process data (you can customize this as needed)
def process_data(raw_data):
    processed = {
        'device_id': raw_data['device_id'],
        'status': raw_data['status'],
        'signal_strength': raw_data['signal_strength'],
        'timestamp': raw_data['timestamp']
    }
    return processed

# Main function to handle async pulling and processing
async def main():
    async with aiohttp.ClientSession() as http_session:
        tasks = [
            pull_device_count_and_list_every_24hrs(http_session),
            pull_every_15min(http_session)
        ]
        await asyncio.gather(*tasks)

# Run the async loop
if __name__ == "__main__":
    # Initialize CSVs with headers
    with open('raw_data.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["device_id", "raw_json"])

    with open('processed_data.csv', mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=["device_id", "status", "signal_strength", "timestamp"])
        writer.writeheader()

    # Run the async data pulling and processing
    asyncio.run(main())



#------------------------------------------------------------
import asyncio
import aiohttp
import pandas as pd
import csv
import json
import os
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Global variables
down_device_tracker = {}  # Tracks devices that are down
semaphore = asyncio.Semaphore(10)  # Limits concurrent API calls to 10

# -----------------------------
# Utility Functions
# -----------------------------

def save_down_device_state():
    """Saves the down devices state to a JSON file."""
    with open('down_devices.json', mode='w') as file:
        json.dump(down_device_tracker, file)

def load_down_device_state():
    """Loads the down devices state from a JSON file."""
    global down_device_tracker
    try:
        with open('down_devices.json', mode='r') as file:
            down_device_tracker = json.load(file)
    except FileNotFoundError:
        down_device_tracker = {}

def save_device_count_to_file(count):
    """Saves the device count to a JSON file."""
    with open('device_count.json', mode='w') as file:
        json.dump({"device_count": count, "timestamp": str(datetime.now())}, file)

def load_device_count_from_file():
    """Loads the device count from a JSON file."""
    try:
        with open('device_count.json', mode='r') as file:
            data = json.load(file)
            return data['device_count']
    except FileNotFoundError:
        return 1800  # Default value if no file is found

def refresh_device_list_csv():
    """Deletes the old device list CSV file if it exists."""
    if os.path.exists('device_list.csv'):
        os.remove('device_list.csv')
        print("Old device list CSV deleted.")

def save_device_list_to_csv_as_df(device_list):
    """Saves the device list to a CSV file using a pandas DataFrame."""
    # Convert the list of devices into a DataFrame
    df = pd.DataFrame(device_list)
    # Select the desired columns
    df = df[['macAddress', 'deviceName', 'reachabilityStatus', 'upTime', 'lastUpdated']]
    # Save to CSV
    df.to_csv('device_list.csv', index=False)
    print("New device list CSV saved.")

def save_raw_data_to_csv(device_id, raw_data):
    """Appends raw data to the raw_data.csv file."""
    with open('raw_data.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([device_id, raw_data])

def save_processed_data_to_csv(processed_data):
    """Appends processed data to the processed_data.csv file."""
    with open('processed_data.csv', mode='a', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=processed_data.keys())
        writer.writerow(processed_data)

def filter_down_devices(device_data):
    """Filters devices where 'reachabilityHealth' is 'DOWN'."""
    return [device for device in device_data if device.get('reachabilityHealth') == 'DOWN']

def mark_device_down(device_id):
    """Marks a device as down with a timestamp."""
    if device_id not in down_device_tracker:
        down_device_tracker[device_id] = str(datetime.now())  # First time marked down
        print(f"Device {device_id} confirmed down at {down_device_tracker[device_id]}")
        save_down_device_state()  # Persist the state

def mark_device_up(device_id):
    """Removes a device from the down tracker when it comes back up."""
    if device_id in down_device_tracker:
        print(f"Device {device_id} is back up, clearing the down record.")
        del down_device_tracker[device_id]
        save_down_device_state()  # Persist the state

# -----------------------------
# Async API Functions
# -----------------------------

async def fetch_with_retry(session, url, params=None, retries=3):
    """Fetches data from the API with retries and timeout."""
    for attempt in range(retries):
        try:
            async with semaphore:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=60)) as response:
                    response.raise_for_status()  # Raises exception for HTTP errors
                    return await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            print(f"Attempt {attempt + 1} failed for URL: {url}. Error: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            else:
                print(f"All retries failed for URL: {url}")
                return None

async def fetch_device_count(session, url):
    """Fetches the total device count."""
    data = await fetch_with_retry(session, url)
    if data:
        return data.get('device_count', 1800)
    return 1800  # Default value if API call fails

async def fetch_device_list(session, url, offset):
    """Fetches the device list in batches."""
    params = {'offset': offset, 'limit': 500}
    data = await fetch_with_retry(session, url, params=params)
    if data:
        return data.get('devices', [])
    return []

async def fetch_device_health(session, url, offset):
    """Fetches device health data in batches."""
    params = {'offset': offset, 'limit': 500}
    data = await fetch_with_retry(session, url, params=params)
    if data:
        return data.get('devices', [])
    return []

async def fetch_device_detail(session, url, device_id):
    """Fetches detailed info for a specific device."""
    detail_url = f"{url}/{device_id}"
    data = await fetch_with_retry(session, detail_url)
    return data

# -----------------------------
# Data Processing Functions
# -----------------------------

def process_data(raw_data):
    """Processes raw data into the desired format."""
    processed = {
        'device_id': raw_data.get('device_id'),
        'status': raw_data.get('status'),
        'signal_strength': raw_data.get('signal_strength'),
        'timestamp': raw_data.get('timestamp', str(datetime.now()))
    }
    return processed

# -----------------------------
# Scheduled Tasks
# -----------------------------

async def pull_device_count_and_list():
    """Task to pull device count and device list every 24 hours."""
    start_time = datetime.now()
    print(f"Started 24-hour task at {start_time}")

    async with aiohttp.ClientSession() as session:
        device_count_url = "http://api.device3.com/get_device_count"
        device_list_url = "http://api.device3.com/get_device_list"

        # Step 1: Get the total device count
        device_count = await fetch_device_count(session, device_count_url)
        save_device_count_to_file(device_count)
        print(f"Updated device count: {device_count}")

        # Step 2: Get the full device list in batches
        full_device_list = []
        for offset in range(0, device_count, 500):
            batch_devices = await fetch_device_list(session, device_list_url, offset)
            full_device_list.extend(batch_devices)
            await asyncio.sleep(1)  # Small delay to avoid overwhelming the API

        # Step 3: Refresh the CSV and save the new list
        refresh_device_list_csv()
        save_device_list_to_csv_as_df(full_device_list)
        print(f"Device list updated and saved as CSV with {len(full_device_list)} devices.")

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    print(f"24-hour task completed in {duration} seconds.")

async def pull_device_health_and_details():
    """Task to pull device health and details every 15 minutes."""
    start_time = datetime.now()
    print(f"Started 15-minute task at {start_time}")

    async with aiohttp.ClientSession() as session:
        # Load the latest device count
        total_devices = load_device_count_from_file()

        # Step 1: Pull device health data in batches
        base_url_health = "http://api.device3.com/device_health"
        down_devices = []
        for offset in range(0, total_devices, 500):
            health_data = await fetch_device_health(session, base_url_health, offset)
            if health_data:
                save_raw_data_to_csv(f"batch_offset_{offset}", health_data)
                down_devices.extend(filter_down_devices(health_data))
            await asyncio.sleep(1)  # Small delay between batches

        print(f"Total devices down: {len(down_devices)}")

        # Step 2: Fetch details for down devices, respecting rate limits
        base_url_detail = "http://api.device3.com/device_detail"
        for i in range(0, len(down_devices), 100):
            tasks = [
                fetch_device_detail(session, base_url_detail, device['device_id'])
                for device in down_devices[i:i+100]
            ]
            device_details = await asyncio.gather(*tasks)

            # Step 3: Process and save device details
            for device in device_details:
                if device:
                    processed_data = process_data(device)
                    save_processed_data_to_csv(processed_data)

                    # Mark device as down or up
                    if device.get('status') == 'DOWN':
                        mark_device_down(device.get('device_id'))
                    else:
                        mark_device_up(device.get('device_id'))

            await asyncio.sleep(60)  # Wait to respect API rate limit

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    print(f"15-minute task completed in {duration} seconds.")

# -----------------------------
# Scheduler Setup
# -----------------------------

def schedule_tasks():
    """Schedules the tasks using APScheduler."""
    scheduler = AsyncIOScheduler()

    # Schedule the 24-hour task
    scheduler.add_job(
        pull_device_count_and_list,
        trigger=IntervalTrigger(hours=24),
        next_run_time=datetime.now()
    )

    # Schedule the 15-minute task
    scheduler.add_job(
        pull_device_health_and_details,
        trigger=IntervalTrigger(minutes=15),
        next_run_time=datetime.now()
    )

    scheduler.start()
    print("Scheduler started.")

# -----------------------------
# Main Entry Point
# -----------------------------

async def main():
    """Main function to start the scheduler and load initial states."""
    # Load down device state
    load_down_device_state()

    # Schedule tasks
    schedule_tasks()

    # Keep the script running
    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, SystemExit):
        print("Shutting down.")

if __name__ == "__main__":
    # Initialize CSV files with headers if they don't exist
    if not os.path.exists('raw_data.csv'):
        with open('raw_data.csv', mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["device_id", "raw_json"])

    if not os.path.exists('processed_data.csv'):
        with open('processed_data.csv', mode='w', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=["device_id", "status", "signal_strength", "timestamp"])
            writer.writeheader()

    # Run the main function
    asyncio.run(main())



    async def get_auth_token(session, auth_url, username, password):
    payload = {'username': username, 'password': password}
    async with session.post(auth_url, json=payload) as response:
        response.raise_for_status()
        data = await response.json()
        return data['auth_token']

async def api_call_with_auth(session, method, url, **kwargs):
    try:
        async with session.request(method, url, **kwargs) as response:
            if response.status == 401:
                # Token expired or invalid, re-authenticate
                auth_token = await get_auth_token(session, AUTH_URL, USERNAME, PASSWORD)
                session.headers.update({'Authorization': f'Bearer {auth_token}'})
                # Retry the request
                async with session.request(method, url, **kwargs) as retry_response:
                    retry_response.raise_for_status()
                    return await retry_response.json()
            else:
                response.raise_for_status()
                return await response.json()
    except Exception as e:
        print(f"API call failed: {e}")
        raise



import csv
from datetime import datetime

# At the top of your script, create an asyncio lock
file_lock = asyncio.Lock()

# Function to append down devices to CSV
async def append_down_devices_to_csv(down_devices):
    async with file_lock:
        file_exists = os.path.exists('down_devices.csv')
        with open('down_devices.csv', mode='a', newline='') as file:
            fieldnames = ['device_id', 'timestamp']
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            for device in down_devices:
                writer.writerow({
                    'device_id': device['device_id'],
                    'timestamp': datetime.now().isoformat()
                })


import pandas as pd
from datetime import timedelta

async def clean_old_entries():
    async with file_lock:
        try:
            df = pd.read_csv('down_devices.csv')
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            cutoff_date = datetime.now() - timedelta(days=14)
            # Keep only entries within the last 14 days
            df = df[df['timestamp'] >= cutoff_date]
            # Overwrite the CSV file with cleaned data
            df.to_csv('down_devices.csv', index=False)
            print("Old entries cleaned from down_devices.csv")
        except FileNotFoundError:
            print("down_devices.csv not found, skipping cleanup.")
        except Exception as e:
            print(f"Error during cleanup: {e}")
