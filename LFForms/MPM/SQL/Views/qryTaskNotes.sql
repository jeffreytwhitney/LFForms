
CREATE VIEW [dbo].[qryTaskNotes]
AS
SELECT        dbo.tblTaskNotes.ID, dbo.tblTaskNotes.TaskID, dbo.tblTaskNotes.TaskNote, dbo.tblTaskNotes.CreatedTimestamp, dbo.tblUser.LName + ', ' + dbo.tblUser.FName AS Name, dbo.tblTaskNotes.UpdateUserID, 
                         dbo.tblTaskNotes.UpdatedTimestamp
FROM            dbo.tblTaskNotes LEFT OUTER JOIN
                         dbo.tblUser ON dbo.tblTaskNotes.UpdateUserID = dbo.tblUser.EmployeeNumber