# coding=utf-8
import logging
import os
from datetime import datetime
import dateutil.tz

from flask import Flask, render_template, request, jsonify
import flask_sqlalchemy as _fs
import flask_migrate
from sqlalchemy import desc

from utils import json_encode


__author__ = 'Kien'
_logger = logging.getLogger(__name__)

app = Flask(__name__)

ROOT_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__),
))
STATIC_FOLDER = os.path.join(ROOT_DIR, 'www', 'static')
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:kienhoang95@localhost/sup'

app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.static_folder = STATIC_FOLDER

db = _fs.SQLAlchemy()
db.app = app
db.init_app(app)

migrate = flask_migrate.Migrate(db=db)
migrate.init_app(app)
_logger.info('Start app with database: %s' % SQLALCHEMY_DATABASE_URI)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/update', methods=['POST'])
def update_records():
    try:
        data = request.json
        duplicate_track = []
        new_orders = []
        for item in data:
            tracking_number = item['trackingNumber']
            existed = Order.query.filter(
                Order.tracking_number == tracking_number
            ).first()  # type: Order

            if existed:
                duplicate_track.append(existed.tracking_number)
            else:
                new_orders.append(item)

        if duplicate_track:
            return json_encode({
                'code': 400,
                'message': 'Invalid data provided',
                'data': duplicate_track
            })

        for item in new_orders:
            order = Order()
            order.tracking_number = item['trackingNumber']
            order.customer_name = item['customer']
            order.size = item['orderSize']
            order.quantity = item['quantity']

            if item['orderDate']:
                order.order_date = datetime.strptime(item['orderDate'],
                                                     '%d/%m/%y')
            order.shop = item['shop']

            db.session.add(order)
            db.session.flush()

        return jsonify({
            'code': 200,
            'message': 'Insert successfully',
            'data': None
        })
    except Exception as e:
        _logger.error(e)
        db.session.rollback()
        raise


@app.route('/copy/<tracking_number>', methods=['POST'])
def copy_order_status(tracking_number):
    order = Order.query.filter(Order.tracking_number == tracking_number).first()
    if order:
        order.copied = True
        return jsonify({'message': 'ok'})
    else:
        raise Exception('No orders were found!')


@app.route('/undo/<tracking_number>', methods=['POST'])
def reset_order_status(tracking_number):
    order = Order.query.filter(Order.tracking_number == tracking_number).first()
    if order:
        order.copied = False
        return jsonify({'message': 'ok'})
    else:
        raise Exception('No orders were found!')


@app.route('/datatables', methods=['GET', 'POST'])
def datatables():
    data = request.args
    customer_name = data.get('customer_name')
    tracking_number = data.get('tracking_number')
    from_date = data.get('from_date')
    to_date = data.get('to_date')
    limit = data.get('length')
    offset = data.get('start')
    draw = data.get('draw')

    query = OrderListQuery()
    query.apply_filters(
        customer_name=customer_name,
        tracking_number=tracking_number,
        from_date=from_date,
        to_date=to_date
    )
    total_records = len(query)
    query.paginate(limit, offset)

    orders = list(query)

    return json_encode({
        'recordsTotal': total_records,
        'recordsFiltered': total_records,
        'data': orders,
        'draw': draw
    })


@app.route('/<tracking_number>/note', methods=['POST'])
def update_note(tracking_number):
    try:
        data = request.data
        order = Order.query.filter(
            Order.tracking_number == tracking_number).first()
        order.note = data
        return jsonify({'message': 'ok'})
    except Exception as e:
        _logger.exception(e)
        return jsonify({'message': 'failed'})


class Order(db.Model):
    """
    Contains information of each order from supplier
    """
    __tablename__ = 'orders'

    def _now(self):
        return datetime.now(tz=dateutil.tz.tzlocal())

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tracking_number = db.Column(db.String(20))
    quantity = db.Column(db.Integer)
    price = db.Column(db.String(10))
    total_price = db.Column(db.String(10))
    size = db.Column(db.String(10))
    customer_name = db.Column(db.String(50))
    order_date = db.Column(db.DateTime)
    note = db.Column(db.Text)
    copied = db.Column(db.Boolean, default=False)
    import_date = db.Column(db.TIMESTAMP, default=_now)
    shop = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'tracking_number': self.tracking_number,
            'quantity': self.quantity,
            'price': self.price,
            'total_price': self.total_price,
            'size': self.size,
            'customer_name': self.customer_name,
            'import_date': self.import_date,
            'note': self.note,
            'copied': self.copied,
            'shop': self.shop
        }


class OrderListQuery(object):
    """
    Query with filters
    """
    def __init__(self):
        self.query = Order.query

    def __len__(self):
        return self.query.count()

    def __iter__(self):
        yield from self.query

    def apply_filters(self, customer_name, tracking_number, from_date, to_date):
        if customer_name:
            self.query = self.query.filter(
                Order.customer_name.like('%%%s%%' % customer_name)
            )

        if tracking_number:
            self.query = self.query.filter(
                Order.tracking_number == tracking_number
            )

        if from_date:
            self.query = self.query.filter(
                Order.import_date >= datetime.strptime(from_date, '%m/%d/%Y')
            )

        if to_date:
            self.query = self.query.filter(
                Order.import_date <= datetime.strptime(to_date, '%m/%d/%Y')
            )

        self.query = self.query.order_by(desc(Order.import_date))

    def paginate(self, limit, offset):
        self.query = self.query.limit(limit).offset(offset)
