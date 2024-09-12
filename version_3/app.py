from flask import Flask, jsonify, render_template
import pandas as pd

app = Flask(__name__)

# Sample data for demonstration: replace these with your actual data sources
# Sample data for New York and Boston devices
ny_basic_info = pd.DataFrame({
    'name': [f'Device_{i}' for i in range(1, 19)],
    'id': [f'ID_{i:03}' for i in range(1, 19)],
    'macAddress': [f'00:1e:0a:59:49:{i:02}' for i in range(1, 19)],
    'apType': ['Type_A', 'Type_B'] * 9,
    'location': [f'Location_{i % 10 + 1}' for i in range(1, 19)],
})

ny_op_status = pd.DataFrame({
    'name': [f'Device_{i}' for i in range(1, 19)],
    'id': [f'ID_{i:03}' for i in range(1, 19)],
    'macAddress': [f'00:1e:0a:59:49:{i:02}' for i in range(1, 19)],
    'connectivityStatus': [100, 50, 0] * 6
})

boston_basic_info = ny_basic_info.copy()
boston_op_status = ny_op_status.copy()
boston_basic_info['location'] = [f'Location_{(i % 5) + 1}' for i in range(18)]
boston_op_status['connectivityStatus'] = [0, 50, 100] * 6

# Dictionary to hold site-specific dataframes
site_dfs = {
    'New York': (ny_basic_info, ny_op_status),
    'Boston': (boston_basic_info, boston_op_status)
}

def calculate_site_info(basic_info, op_status):
    merged_data = pd.merge(basic_info, op_status, on=['name', 'id', 'macAddress'])
    total_devices = len(merged_data)
    healthy_devices = merged_data[merged_data['connectivityStatus'] == 100].shape[0]
    critical_devices = merged_data[merged_data['connectivityStatus'] == 0].shape[0]
    warning_devices = total_devices - healthy_devices - critical_devices
    
    return {
        'totalDevices': total_devices,
        'healthyDevices': healthy_devices,
        'warningDevices': warning_devices,
        'criticalDevices': critical_devices
    }

# Calculate site info for each site and aggregate for the overview
site_data = []
for site_name, (basic_info, op_status) in site_dfs.items():
    site_info = calculate_site_info(basic_info, op_status)
    site_info['siteName'] = site_name
    site_data.append(site_info)

@app.route('/')
def overview():
    return render_template('overview.html')

@app.route('/site-data')
def get_site_data():
    return jsonify(site_data)

@app.route('/site/<site_name>')
def site_details(site_name):
    return render_template('index.html', site_name=site_name)

@app.route('/device-data/<site_name>')
def get_device_data(site_name):
    basic_info, op_status = site_dfs.get(site_name, (pd.DataFrame(), pd.DataFrame()))
    merged_data = pd.merge(basic_info, op_status, on=['name', 'id', 'macAddress'])
    # Add color coding for device status
    merged_data['color'] = merged_data['connectivityStatus'].apply(lambda x: 'green' if x == 100 else 'yellow' if x == 50 else 'red')
    return jsonify(merged_data.to_dict(orient='records'))


if __name__ == '__main__':
    app.run(debug=True)
