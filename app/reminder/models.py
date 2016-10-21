from app import db


class Button(db.Model):
    __tablename__ = 'buttons'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    time_init = db.Column(db.Float)
    times = db.relationship('Time', backref='button')

    def __repr__(self):
        return '<Button %r>' % self.name


class Time(db.Model):
    __tablename__ = 'times'
    id = db.Column(db.Integer, primary_key=True)
    time_press = db.Column(db.Float)
    button_id = db.Column(db.Integer, db.ForeignKey('buttons.id'))

    def __repr__(self):
        return '<Time %r>' % self.time_press
