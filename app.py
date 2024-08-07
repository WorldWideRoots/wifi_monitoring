from flask import Flask, render_template, jsonify
import pandas as pd
import plotly.graph_objects as go

app = Flask(__name__)

# Load data
df = pd.read_csv('device_data.csv')

# Sort and group data by current operation score
df['group'] = pd.cut(df['current_op_score'], bins=[-1, 49, 79, 100], labels=['Poor (0-49)', 'Average (50-79)', 'Good (80-100)'])
df = df.sort_values(by='current_op_score')

@app.route('/')
def index():
    # Create a list of device status circles grouped by score ranges
    grouped_devices = {
        'Poor (0-49)': [],
        'Average (50-79)': [],
        'Good (80-100)': []
    }
    for _, row in df.iterrows():
        device = {
            'id': row['device_id'],
            'score': row['current_op_score'],
            'color': get_color(row['current_op_score'])
        }
        grouped_devices[row['group']].append(device)
    
    return render_template('index.html', grouped_devices=grouped_devices)

@app.route('/table-view')
def table_view():
    # Extract past 16 time steps for each device
    df_table = df[['device_id', 'current_op_score'] + [f'past_time_{i}' for i in range(39, 55)]]
    return render_template('table_view.html', data=df_table.to_dict(orient='records'), get_color_for_score=get_color_for_score)

@app.route('/device/<device_id>')
def device_detail(device_id):
    device_data = df[df['device_id'] == int(device_id)].iloc[0]
    scores = device_data[2:-1].values  # Assuming columns 2 to the second to last are the historical scores
    time_points = list(range(1, len(scores) + 1))  # Time points based on the number of past_time columns
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=time_points,
        y=scores,
        mode='lines+markers',
        name=device_id
    ))
    fig.update_layout(
        title=f'Operation Scores for the Past 24 Hours - Device {device_id}',
        xaxis_title='Time Points',
        yaxis_title='Operation Score',
        xaxis=dict(showgrid=True, zeroline=True),
        yaxis=dict(showline=True)
    )

    graph_json = fig.to_json()
    return jsonify(graph_json)

def get_color(score):
    if score >= 80:
        return 'green'
    elif score >= 50:
        return 'yellow'
    else:
        return 'red'

def get_color_for_score(score):
    if score >= 80:
        return 'green'
    elif score >= 50:
        return 'yellow'
    else:
        return 'red'

if __name__ == '__main__':
    app.run(debug=True)
