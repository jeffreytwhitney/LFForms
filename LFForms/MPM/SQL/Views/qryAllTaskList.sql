
CREATE VIEW [dbo].[qryAllTaskList]
AS
SELECT        TOP (100) PERCENT dbo.tblTask.ID, dbo.tblProject.ProjectName, dbo.tblTask.ManualDueDate, dbo.tblTask.ProjectID, dbo.tblTask.HavePart, dbo.tblTask.TicketNumber, dbo.tblTask.TaskName, dbo.tblTask.DueDate, 
                         dbo.tblTask.ScheduledDueDate, dbo.tblTask.EstimatedHours, dbo.tblTask.DateCompleted, dbo.tblTask.DateStarted, 
						 IIf(ISNULL(dbo.qryTotalHoursByTaskID.TotalHours,0)=0, 0, dbo.qryTotalHoursByTaskID.TotalHours) AS TotalHours,
                          dbo.tblStatus.Status, dbo.tblTaskType.TaskType, dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS AssignedToName, dbo.tblStatus.IsCompleteOrCancelled, dbo.tblStatus.ID AS StatusID, dbo.tblTaskType.ID AS TaskTypeID, 
                         dbo.tblUser.ID AS UserID, dbo.tblProject.DepartmentID, dbo.tblTask.AssignedToID, dbo.tblTask.UpdatedTimestamp, tblUser_1.LName + ', ' + tblUser_1.FName AS LastUpdatedBy
FROM            dbo.tblStatus RIGHT OUTER JOIN
                         dbo.tblProject RIGHT OUTER JOIN
                         dbo.tblUser AS tblUser_1 INNER JOIN
                         dbo.qryTotalHoursByTaskID RIGHT OUTER JOIN
                         dbo.tblUser RIGHT OUTER JOIN
                         dbo.tblTaskType RIGHT OUTER JOIN
                         dbo.tblTask ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.tblUser.ID = dbo.tblTask.AssignedToID ON dbo.qryTotalHoursByTaskID.TaskID = dbo.tblTask.ID ON 
                         tblUser_1.EmployeeNumber = dbo.tblTask.UpdateUserID ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID
ORDER BY dbo.tblTask.TaskName