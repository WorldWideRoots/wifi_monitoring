import aiohttp
import asyncio
import pandas as pd
from datetime import datetime

# Global variables to hold the latest device list and details
device_list = []
device_details_all = []

# Step 1: Function to fetch the list of devices
async def get_device_list(session, condition, headers):
    url = f"https://api.example.com/get_device_list?condition={condition}"
    async with session.get(url, headers=headers) as response:
        response.raise_for_status()  # Ensure we catch HTTP errors
        return await response.json()

# Step 2: Function to fetch details for a specific device
async def get_device_details(session, device_id, headers):
    url = f"https://api.example.com/get_device_details?device_id={device_id}"
    async with session.get(url, headers=headers) as response:
        response.raise_for_status()
        return await response.json()

# Step 3: Task to update device list every 24 hours
async def update_device_list(session, condition, headers):
    global device_list
    while True:
        print("Updating device list...")
        device_list = await get_device_list(session, condition, headers)
        
        # Save device list to CSV
        df_device_list = pd.DataFrame(device_list['devices'])
        df_device_list.to_csv('device_list.csv', index=False)
        
        print(f"Device list updated with {len(device_list['devices'])} devices")
        await asyncio.sleep(24 * 60 * 60)  # Sleep for 24 hours

# Step 4: Task to fetch device details every 20 minutes
async def update_device_details(session, headers):
    global device_list, device_details_all
    while True:
        if device_list:
            print("Fetching device details...")
            tasks = []
            for device in device_list['devices']:
                device_id = device['id']
                task = asyncio.ensure_future(get_device_details(session, device_id, headers))
                tasks.append(task)
            
            device_details = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle the results
            for i, detail in enumerate(device_details):
                if isinstance(detail, Exception):
                    print(f"Error fetching details for device {device_list['devices'][i]['id']}: {detail}")
                else:
                    detail['device_id'] = device_list['devices'][i]['id']
                    device_details_all.append(detail)
                    print(f"Device ID: {device_list['devices'][i]['id']}, Details: {detail}")
            
            # Save device details to CSV
            df_device_details = pd.DataFrame(device_details_all)
            df_device_details.to_csv('device_details.csv', index=False)
        
        await asyncio.sleep(20 * 60)  # Sleep for 20 minutes

# Step 5: Main function to start both tasks
async def main(condition, headers):
    async with aiohttp.ClientSession() as session:
        # Start both tasks
        task1 = asyncio.create_task(update_device_list(session, condition, headers))
        task2 = asyncio.create_task(update_device_details(session, headers))
        
        # Run both tasks concurrently
        await asyncio.gather(task1, task2)

# Entry point to run the asynchronous code
condition = "some_condition"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Accept": "application/json",
    "Custom-Header": "CustomValue"
}

asyncio.run(main(condition, headers))
