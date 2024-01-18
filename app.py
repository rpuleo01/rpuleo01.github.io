from flask import Flask, jsonify, send_from_directory
from flask_compress import Compress
import pandas as pd

app = Flask(__name__)
Compress(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def send_file(path):
    return send_from_directory('.', path)

@app.route('/data')
def data():
    try:
        df = pd.read_csv('data/simple_relations.csv')
        #df = df.drop(columns=['content', 'reduced_text', 'relations'])
        df = df.rename(columns={'source': 'from', 'target': 'to'})
        df = df.where(pd.notnull(df), None)
        edges = df.to_dict(orient='records')  # Convert DataFrame to a list of dictionaries
        print("Edges:", edges)  # Print edges for debugging

        nodes = pd.concat([df['from'], df['to']]).unique()
        nodes = [{'id': node, 'label': node} for node in nodes]
        print(edges[:5])  
        return jsonify({'nodes': nodes, 'edges': edges})
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
application = app
