import asyncio
import aiohttp
import csv
from datetime import datetime

# Async API pulling function
async def fetch_device_data(session, url, device_id):
    async with session.get(url) as response:
        raw_data = await response.json()
        return device_id, raw_data

# Function to process raw data (simple example)
def process_data(raw_data):
    processed = {
        'device_id': raw_data['device_id'],
        'status': raw_data['status'],
        'signal_strength': raw_data['signal_strength'],
        'timestamp': raw_data['timestamp']
    }
    return processed

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

# Periodic pulling for 24 hours, 1 hour, and 15 minutes
async def pull_every_24hrs(http_session):
    while True:
        # Add your 24hr API URLs here
        urls = [
            {"url": "http://api.device1.com/data", "device_id": "device1_24hrs"},
        ]
        tasks = [fetch_device_data(http_session, url["url"], url["device_id"]) for url in urls]
        results = await asyncio.gather(*tasks)
        
        for device_id, raw_data in results:
            save_raw_data_to_csv(device_id, raw_data)
            processed_data = process_data(raw_data)
            save_processed_data_to_csv(processed_data)
        
        await asyncio.sleep(24 * 60 * 60)  # Sleep for 24 hours

async def pull_every_hour(http_session):
    while True:
        # Add your hourly API URLs here
        urls = [
            {"url": "http://api.device2.com/data", "device_id": "device2_1hr"},
        ]
        tasks = [fetch_device_data(http_session, url["url"], url["device_id"]) for url in urls]
        results = await asyncio.gather(*tasks)
        
        for device_id, raw_data in results:
            save_raw_data_to_csv(device_id, raw_data)
            processed_data = process_data(raw_data)
            save_processed_data_to_csv(processed_data)
        
        await asyncio.sleep(60 * 60)  # Sleep for 1 hour

async def pull_every_15min(http_session):
    while True:
        # Add your 15min API URLs here
        urls = [
            {"url": "http://api.device3.com/data", "device_id": "device3_15min"},
        ]
        tasks = [fetch_device_data(http_session, url["url"], url["device_id"]) for url in urls]
        results = await asyncio.gather(*tasks)
        
        for device_id, raw_data in results:
            save_raw_data_to_csv(device_id, raw_data)
            processed_data = process_data(raw_data)
            save_processed_data_to_csv(processed_data)
        
        await asyncio.sleep(15 * 60)  # Sleep for 15 minutes

# Main function to handle async pulling and processing
async def main():
    async with aiohttp.ClientSession() as http_session:
        # Schedule the three tasks
        tasks = [
            pull_every_24hrs(http_session),
            pull_every_hour(http_session),
            pull_every_15min(http_session)
        ]
        await asyncio.gather(*tasks)

# Run the async loop
if __name__ == "__main__":
    # Initialize CSVs with headers
    with open('raw_data.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["device_id", "raw_json"])  # Adjust headers based on raw data

    with open('processed_data.csv', mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=["device_id", "status", "signal_strength", "timestamp"])
        writer.writeheader()

    # Run the async data pulling and processing
    asyncio.run(main())

