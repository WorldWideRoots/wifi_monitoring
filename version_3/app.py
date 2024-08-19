from flask import Flask, jsonify, render_template
import pandas as pd

app = Flask(__name__)

# Sample data (ensure all columns have the same number of elements)
device_basic_info = pd.DataFrame({
    'name': [f'Device{i}' for i in range(1, 101)],
    'id': [f'{i:03d}' for i in range(1, 101)],
    'macAddress': [f'00:14:22:01:23:{i:02d}' for i in range(1, 101)],
    'apType': ['TypeA', 'TypeB', 'TypeC'] * 33 + ['TypeA'],
    'location': [f'Location{i % 10 + 1}' for i in range(1, 101)],
    'upTime': ['10:00:00'] * 100,
    'connectedTime': ['09:30:00'] * 100
})

df_device_20min_op = pd.DataFrame({
    'name': [f'Device{i}' for i in range(1, 101)],
    'connectivityStatus': [0]*30 + [50]*40 + [100]*30,
    'timestamp': ['2024-08-19 10:00:00'] * 100
})

# Merge dataframes on 'name'
df_merged = pd.merge(device_basic_info, df_device_20min_op, on='name')

# Map connectivityStatus to color
def map_color(status):
    if status == 100:
        return 'green'
    elif status == 0:
        return 'red'
    else:
        return 'yellow'

df_merged['color'] = df_merged['connectivityStatus'].apply(map_color)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def get_data():
    return jsonify(df_merged.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
