from flask import Flask, request, jsonify
from climate_point_interpolation import optimized_climate_data
import time
from flask_cors import CORS


app = Flask(__name__) 
CORS(app)


@app.route('/climate_data', methods=["POST"])
def climate_data():
    data = request.get_json()
    if 'latitude' in data and 'longitude' in data and 'elevation' in data:
        latitude = data['latitude']
        longitude = data['longitude']
        elevation = data['elevation']

    
    start_time = time.time()  # Start timer
    climate_data,location_data = optimized_climate_data(latitude, longitude, elevation)
    print("Backend Server Elapsed Time:", time.time() - start_time, "seconds")

    data = {
        'climate_data': climate_data,
        'location_data': location_data,
    }
    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True) 
    