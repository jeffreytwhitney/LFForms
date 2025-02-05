CREATE VIEW dbo.qryActiveTasksByTaskTypeGroup
AS
SELECT        dbo.tblTaskTypeGroup.TaskTypeGroupName, dbo.tblStatus.Status, dbo.tblTask.ID
FROM            dbo.tblTaskTypeGroup RIGHT OUTER JOIN
                         dbo.tblTaskType RIGHT OUTER JOIN
                         dbo.tblStatus RIGHT OUTER JOIN
                         dbo.tblTask ON dbo.tblStatus.ID = dbo.tblTask.StatusID ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.tblTaskTypeGroup.ID = dbo.tblTaskType.TaskTypeGroupID
WHERE        (dbo.tblStatus.IsCompleteOrCancelled = 0)
GO
