CREATE VIEW dbo.qryCountOfCompletedTasks
AS
SELECT        dbo.tblTask.ProjectID, COUNT(dbo.tblTask.ID) AS CountOfID
FROM            dbo.tblStatus INNER JOIN
                         dbo.tblTask ON dbo.tblStatus.ID = dbo.tblTask.StatusID
WHERE        (dbo.tblStatus.IsCompleteOrCancelled = 0)
GROUP BY dbo.tblTask.ProjectID
GO
