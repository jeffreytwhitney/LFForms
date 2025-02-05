CREATE VIEW dbo.qryProjectFilterList
AS
SELECT        dbo.tblTask.ProjectID, dbo.tblProject.ProjectName, dbo.tblProject.DepartmentID, dbo.tblUser.ID AS UserID, dbo.tblStatus.ID AS StatusID, dbo.tblTask.TaskTypeID, dbo.tblTask.AssignedToID, dbo.tblStatus.IsCompleteOrCancelled, 
                         dbo.tblTask.TaskName, dbo.tblTask.TicketNumber, dbo.tblTask.DrawingNumber
FROM            dbo.tblStatus INNER JOIN
                         dbo.tblProject LEFT OUTER JOIN
                         dbo.tblDepartment ON dbo.tblProject.DepartmentID = dbo.tblDepartment.ID INNER JOIN
                         dbo.tblUser RIGHT OUTER JOIN
                         dbo.tblTask ON dbo.tblUser.ID = dbo.tblTask.AssignedToID ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID
