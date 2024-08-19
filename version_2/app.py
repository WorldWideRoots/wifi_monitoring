import pandas as pd
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Load data from CSV files
df_current_op_status = pd.read_csv('synthetic_current_op_status.csv')
df_basic_info = pd.read_csv('synthetic_basic_info.csv')

# Merge the two tables on 'device_name'
merged_df = pd.merge(df_current_op_status, df_basic_info, on='device_name')

# Convert the merged dataframe to a list of dictionaries
device_data = merged_df.to_dict(orient='records')

# Function to determine the color based on current_op_status
def get_color(status):
    if status >= 100:
        return 'green'
    elif status <= 0:
        return 'red'
    else:
        return 'orange'

@app.route('/')
def index():
    # Sort devices by current_op_status (lower scores first)
    sorted_devices = sorted(device_data, key=lambda d: d['current_op_status'])
    return render_template('index.html', devices=sorted_devices)

@app.route('/device/<device_id>')
def device_info(device_id):
    device = next((device for device in device_data if device['device_id'] == device_id), None)
    if device:
        return jsonify(device)
    else:
        return jsonify({'error': 'Device not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
