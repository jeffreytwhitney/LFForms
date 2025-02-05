
CREATE VIEW dbo.qryTaskList
AS
SELECT        dbo.tblTask.ID, dbo.tblTask.ProjectID, dbo.tblProject.InitiatorEmployeeID, Upper(tblTask.TaskName) as TaskName, dbo.tblProject.SiteID, dbo.tblProject.ProjectDescription, dbo.tblTask.DueDate, dbo.tblTask.HavePart, dbo.tblTask.IUNumber, dbo.tblDepartment.DepartmentName, 
                         dbo.tblTask.DrawingNumber, dbo.tblTask.TicketNumber, dbo.tblTask.DateStarted, dbo.tblTask.ScheduledDueDate, dbo.tblTask.EstimatedHours, dbo.tblTask.DateCompleted, dbo.tblProject.DepartmentID, 
                         dbo.tblTask.ManualDueDate, dbo.tblStatus.Status, dbo.tblTaskType.TaskType, dbo.tblProject.ProjectName, dbo.tblUser.ID AS UserID, dbo.tblStatus.ID AS StatusID, dbo.tblTask.TaskTypeID, dbo.tblTask.AssignedToID, 
                         dbo.tblProject.PrimaryProjectOwnerID, dbo.tblProject.SecondaryProjectOwnerID, dbo.tblProject.TertiaryProjectOwnerID, dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS AssignedToName, O1.LName 
                         + ', ' + O1.FName AS PrimaryOwnerName, O2.LName + ', ' + O2.FName AS SecondaryOwnerName, O3.LName + ', ' + O3.FName AS TertiaryOwnerName, O4.LName + ', ' + O4.FName AS InitiatorName, IIf(ISNULL(dbo.qrySumOfTrackedHours.SumOfTrackedHours, 0) 
                         = 0, 0, dbo.qrySumOfTrackedHours.SumOfTrackedHours / dbo.tblTask.EstimatedHours) AS PercentComplete, IIf(ISNULL(dbo.qrySumOfTrackedHours.SumOfTrackedHours, 0) = 0, 0, 
                         dbo.qrySumOfTrackedHours.SumOfTrackedHours) AS SumOfHours, dbo.tblStatus.IsCompleteOrCancelled, dbo.tblJobNumber.JobNumber, dbo.tblJobNumber.JobNumber AS JobNumberSort, tblTask.ManufacturingRev, 
                         tblTask.CustomerRev, ISNULL(tblTask.Operation,10) as Operation
FROM            dbo.tblStatus INNER JOIN
                         dbo.tblUser AS O1 RIGHT OUTER JOIN
                         dbo.tblProject LEFT OUTER JOIN
                         dbo.tblUser AS O2 ON dbo.tblProject.SecondaryProjectOwnerID = O2.ID LEFT OUTER JOIN
                         dbo.tblUser AS O3 ON dbo.tblProject.TertiaryProjectOwnerID = O3.ID LEFT OUTER JOIN
												 dbo.tblUser AS O4 ON dbo.tblProject.InitiatorEmployeeID = O4.ID LEFT OUTER JOIN
                         dbo.tblDepartment ON dbo.tblProject.DepartmentID = dbo.tblDepartment.ID ON O1.ID = dbo.tblProject.PrimaryProjectOwnerID INNER JOIN
                         dbo.tblUser RIGHT OUTER JOIN
                         dbo.qrySumOfTrackedHours RIGHT OUTER JOIN
                         dbo.tblTaskType INNER JOIN
                         dbo.tblTask ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.qrySumOfTrackedHours.TaskID = dbo.tblTask.ID ON dbo.tblUser.ID = dbo.tblTask.AssignedToID LEFT OUTER JOIN
                         dbo.tblJobNumber ON dbo.tblTask.TaskName = dbo.tblJobNumber.TaskName AND dbo.tblTask.ProjectID = dbo.tblJobNumber.ProjectID ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID