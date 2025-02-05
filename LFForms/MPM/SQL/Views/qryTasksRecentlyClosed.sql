

CREATE VIEW [dbo].[qryTasksRecentlyClosed]
AS
SELECT        dbo.tblTask.ID, dbo.tblTask.TaskName, dbo.tblTask.TicketNumber, dbo.tblTask.DueDate, dbo.tblTask.ScheduledDueDate, dbo.tblTaskType.TaskType, dbo.tblStatus.Status, dbo.tblTask.EstimatedHours, 
                         dbo.tblTask.DateCompleted, 1 AS PercentComplete, IIf(ISNULL(dbo.qrySumOfTrackedHours.SumOfTrackedHours,0)=0, 0, dbo.qrySumOfTrackedHours.SumOfTrackedHours) AS SumOfHours, dbo.tblTask.DateStarted, 
                         dbo.tblTask.UpdatedTimestamp, dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS AssignedTo, dbo.tblDepartment.DepartmentName, dbo.tblStatus.IsCompleteOrCancelled, dbo.tblDepartment.ID AS DepartmentID
FROM            dbo.tblStatus INNER JOIN
                         dbo.tblDepartment INNER JOIN
                         dbo.tblProject ON dbo.tblDepartment.ID = dbo.tblProject.DepartmentID INNER JOIN
                         dbo.qrySumOfTrackedHours RIGHT OUTER JOIN
                         dbo.tblUser INNER JOIN
                         dbo.tblTaskType INNER JOIN
                         dbo.tblTask ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.tblUser.ID = dbo.tblTask.AssignedToID ON dbo.qrySumOfTrackedHours.TaskID = dbo.tblTask.ID ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON 
                         dbo.tblStatus.ID = dbo.tblTask.StatusID
WHERE        (dbo.tblTask.DateCompleted >= DATEADD(ww, - 1, { fn NOW() })) AND (dbo.tblStatus.IsCompleteOrCancelled = 1)