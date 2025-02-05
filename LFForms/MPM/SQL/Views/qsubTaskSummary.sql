CREATE VIEW [dbo].qsubTaskSummary
	AS SELECT     COUNT(qryTaskList.ID) AS CountOfTaskGroup, qryTaskList.SiteID, tblTaskTypeGroup.TaskTypeGroupName, qryTaskList.StatusID
FROM            qryTaskList INNER JOIN
                         tblTaskType ON qryTaskList.TaskTypeID = tblTaskType.ID INNER JOIN
                         tblTaskTypeGroup ON tblTaskType.TaskTypeGroupID = tblTaskTypeGroup.ID
GROUP BY qryTaskList.SiteID, tblTaskTypeGroup.TaskTypeGroupName, qryTaskList.StatusID