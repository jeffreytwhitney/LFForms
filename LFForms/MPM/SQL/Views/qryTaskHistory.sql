CREATE VIEW [dbo].[qryTaskHistory]
AS
SELECT        TOP (100) PERCENT dbo.tblAudit_Task.ID, dbo.tblAudit_Task.TaskID, dbo.tblAudit_Task.RecordEventType, dbo.tblProject.ProjectName, dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS AssignedToName, 
                         dbo.tblAudit_Task.DateStarted, dbo.tblAudit_Task.TicketNumber, tblUser_1.LName + ', ' + tblUser_1.FName AS LastUpdatedBy, dbo.tblAudit_Task.TaskName, dbo.tblTaskType.TaskType, dbo.tblAudit_Task.DueDate, 
                         dbo.tblStatus.Status, dbo.tblAudit_Task.ScheduledDueDate, dbo.tblAudit_Task.EstimatedHours, dbo.tblAudit_Task.DateCompleted, dbo.tblAudit_Task.CreatedDateStamp
FROM            dbo.tblAudit_Task LEFT OUTER JOIN
                         dbo.tblStatus ON dbo.tblAudit_Task.StatusID = dbo.tblStatus.ID LEFT OUTER JOIN
                         dbo.tblTaskType ON dbo.tblAudit_Task.TaskTypeID = dbo.tblTaskType.ID LEFT OUTER JOIN
                         dbo.tblProject ON dbo.tblAudit_Task.ProjectID = dbo.tblProject.ID LEFT OUTER JOIN
                         dbo.tblUser AS tblUser_1 ON dbo.tblAudit_Task.UpdateUserID = tblUser_1.EmployeeNumber LEFT OUTER JOIN
                         dbo.tblUser ON dbo.tblAudit_Task.AssignedToID = dbo.tblUser.ID
ORDER BY dbo.tblAudit_Task.TaskName, dbo.tblAudit_Task.CreatedDateStamp