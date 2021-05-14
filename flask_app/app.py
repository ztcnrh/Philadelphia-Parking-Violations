# Dependencies
from os import environ
from flask import Flask, render_template, redirect, jsonify, request
# import sqlalchemy
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow # Need to jsonify the response from "/api/heatmap" route
from .config import LOCAL_API_KEY
# from sqlalchemy.orm import Session
# from sqlalchemy.ext.automap import automap_base
# from sqlalchemy import create_engine, func, inspect, or_


app = Flask(__name__)

# Connect to Heroku Postgres if running on server or sqlite if running locally
app.config['SQLALCHEMY_DATABASE_URI'] = environ.get('DATABASE_URL', '') or "sqlite:///static/data/data_all.sqlite"
# Connect to Heroku Config Vars if running on server or grab api key var from config.py if running locally
app.config['MAP_API_KEY'] = environ.get('API_KEY', '') or LOCAL_API_KEY

# Remove tracking modifications
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)

from .models import Parking, Weather
from .models import ppa_schema # Marshmallow operations

# database_path = '../flask_app/static/data/data_all.sqlite'
# engine = create_engine(f'sqlite:///{database_path}')
# conn = engine.connect()

# Reflect an existing database into a new model
# Base = automap_base()
# Reflect the tables
# Base.prepare(engine, reflect=True)

# View all of the classes that automap found
# print(Base.classes.keys())

# Save references to each table
# Parking = Base.classes.ppa
# Weather = Base.classes.weather
# --------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------


# Routes to retrieve data
# ---------------------------------
# ---------------------------------
@app.route('/api/heatmap')
def map_data():
    # Create a dictionary that holds all of our data needed for the heatmap
    response = {}

    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Query
    # ----- All parking citation coordinates -----
    coordinates = db.session.query(Parking.lat, Parking.lon).all()

    # Convert "sqlalchemy.util._collections.result" type to "list" type
    coordinates_list = []
    for pair in coordinates:
        coordinates_list.append(list(pair))
    
    response['heatmap_coordinates'] = coordinates_list

    # ------------------------
    # Session ends, all queries completed
    # session.close()

    result = ppa_schema.dump(response)
    return jsonify(response)

    # return jsonify(response)

@app.route('/api/violations')
def violation_map():
    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Query
    # ----- Data for specific violation types -----
    violation_types = db.session.query(Parking.lat, Parking.lon, Parking.issue_datetime, Parking.violation_desc,
                              Parking.location, Parking.fine, Parking.issuing_agency).\
                              filter((Parking.violation_desc == 'UNREG/ABANDONED VEH') |
                                     (Parking.violation_desc == 'STOP/BLOCK HIGHWAY') |
                                     (Parking.violation_desc == 'BLOCKNG MASS TRANSIT') |
                                     (Parking.violation_desc == 'PARKED ON GRASS') |
                                     (Parking.violation_desc == 'EXCESSIVE NOISE')).all()

    violation_types_list = []
    for data in violation_types:
        violation_types_list.append(list(data))

    keys = ['lat', 'lon', 'issue_datetime', 'violation_desc', 'location', 'fine', 'issuing_agency']
    violation_types_transformed = [dict(zip(keys, l)) for l in violation_types_list]

    # ------------------------
    # Session ends, all queries completed
    # session.close()

    return jsonify(violation_types_transformed)

@app.route('/api/scatterplot')
def scatterplot_data():
    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Query
    # ----- Parking and weather data by hour -----
    data_per_hour = db.session.query(Weather.dt, Weather.feels_like, Weather.humidity,
                                    Weather.rain_1h, Weather.snow_3h, Weather.weather_description,
                                    db.func.count(Parking.anon_ticket_number), db.func.avg(Parking.fine)).\
                                filter(Parking.ymdh == Weather.ymdh).\
                                group_by(Weather.dt).\
                                order_by(Weather.dt.asc()).all()

    # Make "sqlalchemy.util._collections.result" type into a "list" type
    data_per_hour_list = []
    for data in data_per_hour:
        data_per_hour_list.append(list(data))

    # Transform the queried list of lists into a list of dictionaries
    keys = ['datetime', 'temp_feels_like', 'humidity', 'rain_1h', 'snow_3h',
        'weather_description', 'total_ticket_number', 'fine']

    # Data definitions:
        # 1. Weather datetime (all hours throughout 2017)
        # 2. This temperature parameter accounts for the human perception of weather
        # 3. Humidity by hour, %
        # 4. Rain volume for the last hour, mm
        # 5. Snow volume for the last 3 hours, mm (in liquid state)
        # 6. Weather conditions within the broader weather groups (weather.main)
        # 7. Total # of tickets issued every hour. Note this is from only 30% of all ppa data.
        # 8. Average fine amount, $

    data_per_hour_transformed = [dict(zip(keys, l)) for l in data_per_hour_list]

    # ------------------------
    # Session ends, all queries completed
    # session.close()
    response_list = []
    for data in data_per_hour_transformed:
        response_dict = {}
        response_dict['datetime'] = data['datetime']
        response_dict['temp_feels_like'] = str(data['temp_feels_like'])
        response_dict['humidity'] = str(data['humidity'])
        response_dict['rain_1h'] = str(data['rain_1h'])
        response_dict['snow_3h'] = str(data['snow_3h'])
        response_dict['weather_description'] = data['weather_description']
        response_dict['total_ticket_number'] = str(data['total_ticket_number'])
        response_dict['fine'] = str(data['fine'])

        response_list.append(response_dict) 

    return jsonify(response_list)

@app.route('/api/violation_bar')
def violation_bar_data():

    response = {}
    response['description'] = []
    response['count'] = []
    response['avg_fine'] = []

    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Query
    # ----- Ticket count per violation type -----
    tickets_per_violation = db.session.query(Parking.violation_desc, db.func.count(Parking.anon_ticket_number), db.func.avg(Parking.fine)).\
                                    group_by(Parking.violation_desc).\
                                    order_by(db.func.count(Parking.anon_ticket_number).desc()).\
                                    order_by(db.func.avg(Parking.fine).desc()).all()

    for violation in tickets_per_violation:
        response['description'].append(violation[0])
        response['count'].append(str(violation[1]))
        response['avg_fine'].append(str(violation[2]))

    # ------------------------
    # Session ends, all queries completed
    # session.close()

    return jsonify(response)

@app.route('/api/state_pie')
def state_pie_data():
    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Query
    # ----- Tickets and fine per state -----
    tickets_per_state = db.session.query(Parking.state, db.func.count(Parking.anon_ticket_number), db.func.avg(Parking.fine)).\
                                group_by(Parking.state).\
                                order_by(db.func.count(Parking.anon_ticket_number).desc()).\
                                order_by(db.func.avg(Parking.fine).desc()).all()
    
    # Create a dictionary that contains multiple dictionaries of arrays
    tickets_per_state_dict = {}
    tickets_per_state_dict['state'] = []
    tickets_per_state_dict['count'] = []
    tickets_per_state_dict['avg_fine'] = []

    for state in tickets_per_state:
        tickets_per_state_dict['state'].append(state[0])
        tickets_per_state_dict['count'].append(str(state[1]))
        tickets_per_state_dict['avg_fine'].append(str(round((state[2]), 1)))

    # ------------------------
    # Session ends, all queries completed
    # session.close()

    return jsonify(tickets_per_state_dict)

@app.route('/api/weather_bubble')
def tickets_per_weather():
    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Query
    # ----- Tickets and fine per state -----
    tickets_per_hour = db.session.query(Weather.dt,
                        Weather.month,
                        Weather.day,
                        Weather.hour,
                        Weather.weather_id,
                        Weather.weather_main,
                        Weather.weather_description,
                        db.func.count(Parking.anon_ticket_number)).\
                        filter(Parking.ymdh == Weather.ymdh).\
                        group_by(Weather.dt).\
                        order_by(Weather.weather_id.asc()).all()
    
    tickets_per_hour_dict = {}
    tickets_per_hour_dict['datetime'] = []
    tickets_per_hour_dict['month'] = []
    tickets_per_hour_dict['day'] = []
    tickets_per_hour_dict['hour'] = []
    tickets_per_hour_dict['weather_id'] = []
    tickets_per_hour_dict['weather_main'] = []
    tickets_per_hour_dict['weather_description'] = []
    tickets_per_hour_dict['anon_ticket_number'] = []

    for i in tickets_per_hour:
        tickets_per_hour_dict['datetime'].append(i[0])
        tickets_per_hour_dict['month'].append(i[1])
        tickets_per_hour_dict['day'].append(i[2])
        tickets_per_hour_dict['hour'].append(i[3])
        tickets_per_hour_dict['weather_id'].append(i[4])
        tickets_per_hour_dict['weather_main'].append(i[5])
        tickets_per_hour_dict['weather_description'].append(i[6])
        tickets_per_hour_dict['anon_ticket_number'].append(i[7])                  

    # ------------------------
    # Session ends, all queries completed
    # session.close()

    return jsonify(tickets_per_hour_dict)

@app.route('/api/weather_bubble_avg')
def avg_tickets_per_weather():
    # Create our session (link) from Python to the DB
    # session = Session(engine)

    # Queries
    # ----- Average aggregated ticket count per weather type for all 2017 hours -----
    ticket_count = db.session.query(Weather.weather_id,
                                 Weather.weather_main,
                             Weather.weather_description,
                       db.func.count(Parking.anon_ticket_number)).\
                       filter(Parking.ymdh == Weather.ymdh).\
                       group_by(Weather.weather_id, Weather.weather_main, Weather.weather_description).\
                       order_by(Weather.weather_id.asc()).all()

    hour_count = db.session.query(Weather.weather_id,
                               Weather.weather_main,
                               Weather.weather_description,
                     db.func.count(Weather.weather_description)).\
                     group_by(Weather.weather_id, Weather.weather_main, Weather.weather_description).\
                     order_by(Weather.weather_id.asc()).all()

    # Calculate the average tickets per hour based on each weather type
    ticket_count_list = []
    for i in ticket_count:
        ticket_count_list.append(i[3])

    hour_count_list = []
    for i in hour_count:
        hour_count_list.append(i[3])
        
    avg_count_list = []
    for i in range(len(ticket_count_list)):
        avg_count_list.append(ticket_count_list[i]/hour_count_list[i])

    avg_tickets_per_weather_type = {}

    avg_tickets_per_weather_type['weather_id'] = []
    avg_tickets_per_weather_type['weather_main'] = []
    avg_tickets_per_weather_type['weather_description'] = []
    avg_tickets_per_weather_type['ticket_count'] = []

    for index, data in enumerate(ticket_count):
        avg_tickets_per_weather_type['weather_id'].append(data[0])
        avg_tickets_per_weather_type['weather_main'].append(data[1])
        avg_tickets_per_weather_type['weather_description'].append(data[2])
        avg_tickets_per_weather_type['ticket_count'].append(round(avg_count_list[index], 1))

    # ------------------------
    # Session ends, all queries completed
    # session.close()

    return jsonify(avg_tickets_per_weather_type)



# Routes to render templates
# ---------------------------------
# ---------------------------------

# Home Route
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/map')
def heatmap():
    # Return map.html and also pass over api key
    return render_template("map.html", api_key=app.config['MAP_API_KEY'])

@app.route('/scatterplot')
def scatterplot():
    return render_template("scatterplot.html")

@app.route('/charts')
def bargraph():
    return render_template("statCharts.html")




if __name__ == '__main__':
    app.run(debug=True)
