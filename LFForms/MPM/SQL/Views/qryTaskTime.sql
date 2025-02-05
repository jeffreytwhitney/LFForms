
CREATE VIEW [dbo].[qryTaskTime]
AS
SELECT        dbo.tblTask.TaskName, dbo.tblTaskTimeEntry.ID, dbo.tblTaskTimeEntry.TaskID, dbo.tblTaskTimeEntry.AssignedToID, dbo.tblTaskTimeEntry.EntryDate, dbo.tblTaskTimeEntry.Hours, 
                         dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS Name, dbo.tblTaskTimeEntry.UpdatedTimestamp, tblUser_1.FName + ' ' + tblUser_1.LName AS LastUpdatedBy
FROM            dbo.tblUser AS tblUser_1 INNER JOIN
                         dbo.tblUser INNER JOIN
                         dbo.tblTask INNER JOIN
                         dbo.tblTaskTimeEntry ON dbo.tblTask.ID = dbo.tblTaskTimeEntry.TaskID ON dbo.tblUser.ID = dbo.tblTask.AssignedToID ON tblUser_1.EmployeeNumber = dbo.tblTaskTimeEntry.UpdateUserID