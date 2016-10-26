"""empty message

Revision ID: 7b812b5f8a40
Revises: 9ebd90e44f68
Create Date: 2016-10-24 14:53:47.888958

"""

# revision identifiers, used by Alembic.
revision = '7b812b5f8a40'
down_revision = '9ebd90e44f68'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('buttons', sa.Column('time_init', sa.String(length=64), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('buttons', 'time_init')
    ### end Alembic commands ###
