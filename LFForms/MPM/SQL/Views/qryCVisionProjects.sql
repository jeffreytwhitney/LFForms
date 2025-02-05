CREATE VIEW dbo.qryCVisionProjects
AS
SELECT        ProjectID, TaskTypeID
FROM            dbo.tblTask
WHERE        (TaskTypeID = 8)
GO
