CREATE VIEW dbo.qryUnassignedTasksByTaskTypeGroup
AS
SELECT        dbo.tblTaskTypeGroup.TaskTypeGroupName, COUNT(dbo.tblTask.ID) AS CountOfUnassigned, dbo.tblProject.SiteID
FROM            dbo.tblStatus RIGHT OUTER JOIN
                         dbo.tblTaskType RIGHT OUTER JOIN
                         dbo.tblProject RIGHT OUTER JOIN
                         dbo.tblTask ON dbo.tblProject.ID = dbo.tblTask.ProjectID ON dbo.tblTaskType.ID = dbo.tblTask.TaskTypeID ON dbo.tblStatus.ID = dbo.tblTask.StatusID LEFT OUTER JOIN
                         dbo.tblTaskTypeGroup ON dbo.tblTaskType.TaskTypeGroupID = dbo.tblTaskTypeGroup.ID
GROUP BY dbo.tblTaskTypeGroup.TaskTypeGroupName, dbo.tblStatus.IsCompleteOrCancelled, dbo.tblTask.AssignedToID, dbo.tblProject.SiteID
HAVING        (dbo.tblStatus.IsCompleteOrCancelled = 0) AND (dbo.tblTask.AssignedToID IS NULL)
