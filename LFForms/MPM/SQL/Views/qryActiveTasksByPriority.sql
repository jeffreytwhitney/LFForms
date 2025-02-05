CREATE VIEW dbo.qryActiveTasksByPriority
AS
SELECT        dbo.tblTask.ID AS TaskID, dbo.tblTask.ProjectID, dbo.tblTask.AssignedToID, dbo.tblProject.ProjectName, dbo.tblProject.SiteID, dbo.tblTask.TaskName, dbo.tblTask.TaskTypeID, dbo.tblStatus.ID AS StatusID, dbo.tblDepartment.DepartmentName, dbo.tblTaskType.TaskType, 
                         dbo.tblStatus.Status, dbo.tblTask.CreatedTimestamp, dbo.tblTask.DueDate, dbo.tblTask.ScheduledDueDate, dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS Assignee, dbo.tblTask.ManualDueDate
FROM            dbo.tblStatus RIGHT OUTER JOIN
                         dbo.tblProject LEFT OUTER JOIN
                         dbo.tblDepartment ON dbo.tblProject.DepartmentID = dbo.tblDepartment.ID RIGHT OUTER JOIN
                         dbo.tblUser RIGHT OUTER JOIN
                         dbo.tblTaskType RIGHT OUTER JOIN
                         dbo.tblTask ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.tblUser.ID = dbo.tblTask.AssignedToID ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID
WHERE        (dbo.tblTask.DateCompleted IS NULL) AND (dbo.tblStatus.IsCompleteOrCancelled = 0)