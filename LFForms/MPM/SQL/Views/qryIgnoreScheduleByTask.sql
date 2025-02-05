CREATE VIEW dbo.qryIgnoreScheduleByTask
AS
SELECT        dbo.tblIgnoreScheduleByTask.TaskName, dbo.tblIgnoreScheduleByTask.ScheduleIDToIgnore
FROM            dbo.tblIgnoreScheduleByTask INNER JOIN
                         dbo.tblStatus INNER JOIN
                         dbo.tblTask ON dbo.tblStatus.ID = dbo.tblTask.StatusID ON dbo.tblIgnoreScheduleByTask.TaskName = dbo.tblTask.TaskName
WHERE        (dbo.tblStatus.IsCompleteOrCancelled = 0)
