from flask import Flask, jsonify, render_template
import pandas as pd 

app = Flask(__name__)

basic_info_df = pd.read_csv('basic_info.csv')
op_status_df = pd.read_csv('op_status.csv')
merged_df = pd.merge(basic_info_df, op_status_df, on=['name', 'id', 'macAddress'])

# Sample data for the devices
device_data = [
    {
        "name": "Device_1",
        "id": "ID_001",
        "macAddress": "00:1e:0a:59:49:29",
        "apType": "Type_A",
        "location": "Location_5",
        "upTime": 46537,
        "connectedTime": 4678,
        "connectivityStatus": 100,
        "timestamp": "2024-08-22T12:34:56Z",
        "color": "green"
    },
    {
        "name": "Device_2",
        "id": "ID_002",
        "macAddress": "00:0a:37:0f:1e:25",
        "apType": "Type_B",
        "location": "Location_2",
        "upTime": 27782,
        "connectedTime": 6754,
        "connectivityStatus": 75,
        "timestamp": "2024-08-22T12:35:56Z",
        "color": "yellow"
    },
        {
        "name": "Device_3",
        "id": "ID_003",
        "macAddress": "00:56:18:55:04:4e",
        "apType": "Type_C",
        "location": "Location_3",
        "upTime": 49980,
        "connectedTime": 8013,
        "connectivityStatus": 50,
        "timestamp": "2024-08-22T12:36:56Z",
        "color": "yellow"
    },
    {
        "name": "Device_4",
        "id": "ID_004",
        "macAddress": "00:22:16:2c:3c:24",
        "apType": "Type_A",
        "location": "Location_8",
        "upTime": 43991,
        "connectedTime": 8202,
        "connectivityStatus": 25,
        "timestamp": "2024-08-22T12:37:56Z",
        "color": "red"
    },
    {
        "name": "Device_5",
        "id": "ID_005",
        "macAddress": "00:0e:56:13:62:06",
        "apType": "Type_A",
        "location": "Location_10",
        "upTime": 24778,
        "connectedTime": 6691,
        "connectivityStatus": 10,
        "timestamp": "2024-08-22T12:38:56Z",
        "color": "red"
    }
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    return jsonify(device_data)

if __name__ == '__main__':
    app.run(debug=True)

