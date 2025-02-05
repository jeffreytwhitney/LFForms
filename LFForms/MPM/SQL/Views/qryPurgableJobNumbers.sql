CREATE VIEW dbo.qryPurgableJobNumbers
AS
SELECT DISTINCT dbo.tblJobNumber.ID
FROM            dbo.tblStatus INNER JOIN
                         dbo.tblJobNumber INNER JOIN
                         dbo.tblTask ON dbo.tblJobNumber.TaskName = dbo.tblTask.TaskName AND dbo.tblJobNumber.ProjectID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID
WHERE        (dbo.tblStatus.IsCompleteOrCancelled = 1) AND (dbo.tblJobNumber.JobNumber NOT IN
                             (SELECT        JobNumber
                               FROM            dbo.tblJobNumbersFrom1Factory))
GO
