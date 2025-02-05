CREATE VIEW dbo.qryProjectsByTaskStatus
AS
SELECT DISTINCT dbo.tblProject.ID, COUNT(dbo.tblTask.ID) AS CountOfID
FROM            dbo.tblStatus RIGHT OUTER JOIN
                         dbo.tblProject LEFT OUTER JOIN
                         dbo.tblTask ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblStatus.ID = dbo.tblTask.StatusID
WHERE        (dbo.tblStatus.IsCompleteOrCancelled = 0)
GROUP BY dbo.tblProject.ID
GO
