"""empty message

Revision ID: 4995d8d6ce19
Revises: ac86c528a85f
Create Date: 2019-03-01 14:12:36.946317

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4995d8d6ce19'
down_revision = 'ac86c528a85f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_unique_constraint(None, 'orders', ['tracking_number'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'orders', type_='unique')
    # ### end Alembic commands ###
