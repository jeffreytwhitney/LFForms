CREATE VIEW dbo.qryMaxTaskAuditIDByTaskID
AS
SELECT        TaskID, MAX(ID) AS MaxOfID
FROM            dbo.tblAudit_Task
GROUP BY TaskID, RecordEventType
HAVING        (RecordEventType = 'Updated')
GO
