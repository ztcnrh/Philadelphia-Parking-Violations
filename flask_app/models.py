from .app import db
from .app import ma

class Parking(db.Model):
    __tablename__ = 'ppa'

    anon_ticket_number = db.Column(db.Integer, primary_key=True)
    issue_datetime = db.Column(db.DateTime)
    state = db.Column(db.String(20))
    anon_plate_id = db.Column(db.String(50))
    location = db.Column(db.String(250))
    violation_desc = db.Column(db.String(100))
    fine = db.Column(db.Integer)
    issuing_agency = db.Column(db.String(100))
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    zip_code = db.Column(db.String(100))
    month = db.Column(db.Integer)
    day = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    ymdh = db.Column(db.String(100))

    def __repr__(self):
        return '<Parking %r>' % (self.name)


class ParkingSchema(ma.Schema):
    class Meta:
        fields = ('anon_ticket_number','issue_datetime','state',
                  'anon_plate_id','location','violation_desc',
                  'fine','issuing_agency','lat',
                  'lon','zip_code','month',
                  'day','hour','ymdh'
                  )

ppa_schema = ParkingSchema()
ppas_schema = ParkingSchema(many=True)


class Weather(db.Model):
    __tablename__ = 'weather'

    dt = db.Column(db.DateTime, primary_key=True)
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    temp = db.Column(db.Float)
    feels_like = db.Column(db.Float)
    temp_min = db.Column(db.Float)
    temp_max = db.Column(db.Float)
    humidity = db.Column(db.Integer)
    wind_speed = db.Column(db.Float)
    wind_deg = db.Column(db.Integer)
    rain_1h = db.Column(db.Float)
    rain_3h = db.Column(db.Float)
    snow_1h = db.Column(db.Float)
    snow_3h = db.Column(db.Float)
    clouds_all = db.Column(db.Integer)
    weather_id = db.Column(db.String(20))
    weather_main = db.Column(db.String(30))
    weather_description = db.Column(db.String(300))
    weather_icon = db.Column(db.String(20))
    month = db.Column(db.Integer)
    day = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    ymdh = db.Column(db.String(100))

    def __repr__(self):
        return '<Weather %r>' % (self.name)
