from flask import Flask, render_template, jsonify, request
import pandas as pd
import plotly.graph_objects as go

app = Flask(__name__)

# Load device data from CSV files
healthy_devices_df = pd.read_csv('healthy_devices.csv')
abnormal_devices_df = pd.read_csv('abnormal_devices.csv')
down_devices_df = pd.read_csv('down_devices.csv')

# Assign group labels directly
healthy_devices_df['group'] = 'Healthy'
abnormal_devices_df['group'] = 'Abnormal'
down_devices_df['group'] = 'Down'

# Combine all devices into one dataframe
df = pd.concat([healthy_devices_df, abnormal_devices_df, down_devices_df])

# Calculate counts and percentages for each category based on the total number of devices
total_devices = len(df)
category_counts = df['group'].value_counts()
category_percentages = (category_counts / total_devices * 100).round(2)

def get_color(score):
    if score == 0:
        return 'red'
    elif score >= 95:
        return 'green'
    else:
        return 'yellow'

@app.route('/')
def index():
    grouped_devices = {
        'Down': down_devices_df.to_dict(orient='records'),
        'Abnormal': abnormal_devices_df.to_dict(orient='records'),
        'Healthy': healthy_devices_df.to_dict(orient='records')
    }
    
    category_info = {
        'Down': f"{category_counts.get('Down', 0)} ({category_percentages.get('Down', 0)}%)",
        'Abnormal': f"{category_counts.get('Abnormal', 0)} ({category_percentages.get('Abnormal', 0)}%)",
        'Healthy': f"{category_counts.get('Healthy', 0)} ({category_percentages.get('Healthy', 0)}%)"
    }
    
    return render_template('index.html', grouped_devices=grouped_devices, category_info=category_info, get_color=get_color)

@app.route('/device/<device_id>')
def device_detail(device_id):
    group = request.args.get('group')
    time_range = request.args.get('time_range', '24hrs')

    if group == 'Healthy':
        device_data = healthy_devices_df[healthy_devices_df['device_id'] == int(device_id)].iloc[0]
        scores = device_data[2:58].values  # 24 hours (56 time steps)
    elif group == 'Abnormal':
        if time_range == '3days':
            device_data = abnormal_devices_df[abnormal_devices_df['device_id'] == int(device_id)].iloc[0]
            scores = device_data[2:170].values  # 3 days data (168 time steps)
        else:  # Default to 24 hours
            device_data = abnormal_devices_df[abnormal_devices_df['device_id'] == int(device_id)].iloc[0]
            scores = device_data[2:58].values  # 24 hours data
    elif group == 'Down':
        if time_range == '7days':
            device_data = down_devices_df[down_devices_df['device_id'] == int(device_id)].iloc[0]
            scores = device_data[2:338].values  # 7 days data (336 time steps)
        else:  # Default to 24 hours
            device_data = down_devices_df[down_devices_df['device_id'] == int(device_id)].iloc[0]
            scores = device_data[2:58].values  # 24 hours data

    time_points = list(range(1, len(scores) + 1))
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=time_points,
        y=scores,
        mode='lines+markers',
        name=device_id
    ))
    fig.update_layout(
        title=f'Operation Scores for Device {device_id} ({time_range})',
        xaxis_title='Time Points',
        yaxis_title='Operation Score',
        xaxis=dict(showgrid=True, zeroline=True),
        yaxis=dict(showline=True)
    )

    graph_json = fig.to_json()
    return jsonify(graph_json)

@app.route('/table-view')
def table_view():
    df_table = df.copy()
    # Adjust columns to match up to the correct number of time steps
    df_table = df_table[['device_id', 'current_op_score'] + [f'past_time_{i+1}' for i in range(df_table.shape[1] - 2)] + ['group']]
    
    return render_template('table_view.html', data=df_table.to_dict(orient='records'), get_color=get_color)

if __name__ == '__main__':
    app.run(debug=True)
