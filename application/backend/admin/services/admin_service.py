from sqlalchemy.orm import Session
from admin.models.reports import Reports
from admin.schemas.report_schema import ReportInfo
#admin should see all reports, find one report?
def create_report(db:Session, data:ReportInfo):
    report = Reports(
        reporter_id = data.reporter_id,
        reported_user_id = data.reported_user_id,
        reason = data.reason
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
#all reports for all users
def get_all_reports(db:Session):
    return db.query(Reports).order_by(Reports.created_at.desc()).all()

#user specific reports
def get_user_reports(db:Session, user_id:int):
    return db.query(Reports).filter(Reports.reported_user_id==user_id).all()