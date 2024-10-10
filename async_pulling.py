
\import asyncio
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
    # Processing logic here: extract signal strength, status, etc.
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

# Main function to handle async pulling and processing
async def main():
    # Add your URLs for different devices
    urls = [
        {"url": "http://api.device1.com/data", "device_id": "device1"},
        {"url": "http://api.device2.com/data", "device_id": "device2"},
        # Add more URLs as needed
    ]
    
    async with aiohttp.ClientSession() as http_session:
        tasks = [fetch_device_data(http_session, url["url"], url["device_id"]) for url in urls]
        results = await asyncio.gather(*tasks)
        
        for device_id, raw_data in results:
            # Save raw data to CSV
            save_raw_data_to_csv(device_id, raw_data)
            
            # Process data and save to processed CSV
            processed_data = process_data(raw_data)
            save_processed_data_to_csv(processed_data)

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
