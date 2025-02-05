CREATE VIEW [dbo].qryCountOfUnassignedTasksByTaskTypeGroup
	AS SELECT        COUNT(qryTaskList.ID) AS CountOfTaskGroup, tblTaskTypeGroup.TaskTypeGroupName
FROM            qryTaskList INNER JOIN
                         tblTaskType ON qryTaskList.TaskTypeID = tblTaskType.ID INNER JOIN
                         tblTaskTypeGroup ON tblTaskType.TaskTypeGroupID = tblTaskTypeGroup.ID
WHERE qryTaskList.AssignedToID IS NULL
GROUP BY tblTaskTypeGroup.TaskTypeGroupName