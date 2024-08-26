from fasthtml.common import *
import pandas as pd

# Load and merge data
basic_info_df = pd.read_csv('basic_info.csv')
op_status_df = pd.read_csv('op_status.csv')
merged_df = pd.merge(basic_info_df, op_status_df, on=['name', 'id', 'macAddress'])

app, rt = fast_app()

# Mock data for the devices (replace with actual data or dynamic fetch)
device_data = list(merged_df.T.to_dict().values())

# Function to generate the health indicator color
def health_indicator(status):
    if status == 100:
        return 'green'
    elif 50 <= status < 100:
        return 'yellow'
    else:
        return 'red'

@rt('/')
def homepage():
    dashboard_items = []
    for device in device_data:
        color = health_indicator(device['connectivityStatus'])
        dashboard_items.append(
            Div(
                A('●', href=f'/device/{device["name"]}', 
                  style=f'color: {color}; font-size: 48px; text-decoration: none; position: relative;', 
                  cls='device-dot'),
                Div(f'{device["name"]}: {device["connectivityStatus"]}', cls='tooltip')
            )
        )

    return Div(
        H1('Device Status Dashboard'),
        Div(
            Label('Choose Theme:'),
            Select(
                Option('Bright', value='light'),
                Option('Dark', value='dark'),
                id='theme-toggle'
            ),
            id='theme-selector'
        ),
        Div(*dashboard_items, id='dashboard', style="display: flex; flex-wrap: wrap; gap: 20px;"),
        Div(id='details'),
        Script('''
            document.getElementById('theme-toggle').addEventListener('change', function() {
                if (this.value === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            });
        '''),
        Style('''
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: var(--bg-color);
                color: var(--text-color);
                transition: background-color 0.3s, color 0.3s;
            }
            h1 {
                background-color: var(--header-bg-color);
                color: var(--header-text-color);
                padding: 20px;
                margin: 0;
                text-align: center;
            }
            #theme-selector {
                margin: 20px auto;
                text-align: right;
                padding-right: 30px;
            }
            #dashboard {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            .device {
                width: 60px;
                height: 60px;
                margin: 10px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .device.green {
                background-color: #28a745;
            }
            .device.yellow {
                background-color: #ffc107;
                color: #000;
            }
            .device.red {
                background-color: #dc3545;
            }
            .device:hover {
                transform: scale(1.1);
            }
            #details {
                margin-top: 30px;
                text-align: center;
            }
            #details h3 {
                margin-bottom: 20px;
            }
            :root {
                --bg-color: #f5f5f5;
                --text-color: #333;
                --header-bg-color: #28a745;
                --header-text-color: #fff;
            }
            body.dark-mode {
                --bg-color: #333;
                --text-color: #f5f5f5;
                --header-bg-color: #444;
                --header-text-color: #fff;
            }
            .tooltip {
                visibility: hidden;
                background-color: black;
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 5px;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                margin-left: -60px;
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 14px;
                white-space: nowrap;
            }
            .device-dot:hover .tooltip {
                visibility: visible;
                opacity: 1;
            }
        ''')
    )

@rt('/device/{name}')
def device_detail(request, name: str = None):
    device_info = next((d for d in device_data if d['name'] == name), None)
    
    if device_info is None:
        return Div(H2(f'Device "{name}" not found'), A('Back to Home', href='/'))
    
    return Div(
        H3(f'Details for {device_info["name"]}:'),
        P(f'ID: {device_info["id"]}'),
        P(f'MAC Address: {device_info["macAddress"]}'),
        P(f'AP Type: {device_info["apType"]}'),
        P(f'Location: {device_info["location"]}'),
        P(f'Uptime: {device_info["upTime"]} seconds'),
        P(f'Connected Time: {device_info["connectedTime"]} seconds'),
        P(f'Connectivity Status: {device_info["connectivityStatus"]}'),
        P(f'Timestamp: {device_info["timestamp"]}'),
        A('Back to Home', href='/')
    )

serve()

