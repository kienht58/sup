"""empty message

Revision ID: 6a7afd382835
Revises: e53d96221fae
Create Date: 2019-03-05 09:48:46.269405

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6a7afd382835'
down_revision = 'e53d96221fae'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('orders', sa.Column('shop', sa.Text(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('orders', 'shop')
    # ### end Alembic commands ###
