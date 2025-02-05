CREATE VIEW dbo.qryTotalHoursByTaskID
AS
SELECT        TaskID, SUM(Hours) AS TotalHours
FROM            dbo.tblTaskTimeEntry
GROUP BY TaskID
GO
