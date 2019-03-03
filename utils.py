# coding=utf-8
import logging
import flask
import enum
import decimal
import datetime

__author__ = 'Kien'
_logger = logging.getLogger(__name__)


class JSONEncoder(flask.json.JSONEncoder):
    """Customized flask JSON Encoder"""

    def default(self, o):
        """
        Override default method
        :param object o:
        """
        from main import db
        if hasattr(o, '__json__'):
            return o.__json__()
        if isinstance(o, decimal.Decimal):
            if o == o.to_integral_value():
                return int(o)
            else:
                return float(o)
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat(sep=' ')
        if isinstance(o, enum.Enum):
            return o.value
        if isinstance(o, tuple):
            return list(o)
        if isinstance(o, db.Model):
            return o.to_dict()
        return super().default(o)


_default_json_encoder = JSONEncoder()
json_encode = _default_json_encoder.encode
