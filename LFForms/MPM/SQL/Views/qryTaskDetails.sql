CREATE VIEW [dbo].[qryTaskDetails]
AS
SELECT        dbo.tblTask.ID, dbo.tblTask.TaskName, dbo.tblProject.ProjectDescription, dbo.tblProject.ProjectName, dbo.tblDepartment.DepartmentName, dbo.tblTask.TicketNumber, dbo.tblTask.DueDate, dbo.tblTask.ScheduledDueDate, 
                         dbo.tblTask.EstimatedHours, dbo.tblTaskType.TaskType, dbo.tblStatus.Status, dbo.qrySumOfTrackedHours.SumOfTrackedHours, PrimaryProjectOwner.LName + ', ' + PrimaryProjectOwner.FName AS PrimaryProjectOwnerName, 
                         SecondaryProjectOwner.LName + ', ' + SecondaryProjectOwner.FName AS SecondaryProjectOwnerName
FROM            dbo.tblStatus INNER JOIN
                         dbo.tblUser AS SecondaryProjectOwner RIGHT OUTER JOIN
                         dbo.tblUser AS PrimaryProjectOwner RIGHT OUTER JOIN
                         dbo.tblProject INNER JOIN
                         dbo.tblDepartment ON dbo.tblProject.DepartmentID = dbo.tblDepartment.ID 
												 ON PrimaryProjectOwner.ID = dbo.tblProject.PrimaryProjectOwnerID ON 
                         SecondaryProjectOwner.ID = dbo.tblProject.SecondaryProjectOwnerID INNER JOIN
                         dbo.qrySumOfTrackedHours RIGHT OUTER JOIN
                         dbo.tblTaskType INNER JOIN
                         dbo.tblTask ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.qrySumOfTrackedHours.TaskID = dbo.tblTask.ID ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID