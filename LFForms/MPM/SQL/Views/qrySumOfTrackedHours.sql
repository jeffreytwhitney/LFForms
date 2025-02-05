CREATE VIEW dbo.qrySumOfTrackedHours
AS
SELECT        dbo.tblTask.ID AS TaskID, SUM(dbo.tblTaskTimeEntry.Hours) AS SumOfTrackedHours
FROM            dbo.tblTask INNER JOIN
                         dbo.tblTaskTimeEntry ON dbo.tblTask.ID = dbo.tblTaskTimeEntry.TaskID
GROUP BY dbo.tblTask.ID
GO
