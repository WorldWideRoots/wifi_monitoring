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


