from search.database import engine, Base
from schedule.models import Booking, AvailabilitySlot

print("Creating tables...")
# This will create tables for all models registered with Base,
# but specifically ensures Booking and AvailabilitySlot are imported/registered
Base.metadata.create_all(bind=engine)
print("Tables created successfully")
