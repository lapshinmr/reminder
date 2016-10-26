"""empty message

Revision ID: c8c6fe8aacf8
Revises: 7b812b5f8a40
Create Date: 2016-10-24 14:59:54.450536

"""

# revision identifiers, used by Alembic.
revision = 'c8c6fe8aacf8'
down_revision = '7b812b5f8a40'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('times', 'time_press')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('times', sa.Column('time_press', mysql.FLOAT(), nullable=True))
    ### end Alembic commands ###
