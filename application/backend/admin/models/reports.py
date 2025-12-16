"""
Report model representing reports submited to admin.
"""
from sqlalchemy import Column, Integer, ForeignKey, Text, Enum, DateTime
from sqlalchemy.orm import relationship
from search.database import Base
from datetime import datetime
"""
reports : 
Columns:
report_id primary Key, 
reporter_user_id Foreign Key,
reported_tutor_id Foreign Key, changing this one because students might also need to be reported on
reason, created_at
status added
Description: User-submitted complaints or issue logs.
"""
class Reports(Base):
    __tablename__ ="reports"

    report_id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.user_id"))
    reported_user_id = Column(Integer, ForeignKey("users.user_id"))
    reason = Column(Text, nullable =True)
    status = Column(Enum("submitted", "reviewing", "closed"), default="submitted")
    created_at = Column(DateTime, default = datetime.utcnow)
