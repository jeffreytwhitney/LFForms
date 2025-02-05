
CREATE VIEW [dbo].[qryTaskAssignments]
AS
SELECT	top 100 percent tblTask.ID, 
		tblTask.AssignedToID, 
		tblTask.ProjectID, 
		tblUser.[LName]+', '+tblUser.[FName] AS Assignee, 
		tblTask.TaskTypeID, 
		tblTask.TaskName, 
		tblTask.StatusID, 
		tblTask.DueDate, 
		tblTask.ScheduledDueDate, 
		tblTask.EstimatedHours, 
		tblTaskType.TaskType, 
		tblStatus.Status, 
		IIf(IsNull([qrySumOfTrackedHours].[SumOfTrackedHours], 0)=0,0,[qrySumOfTrackedHours].[SumOfTrackedHours]/[tblTask].[EstimatedHours]) AS PctComplete, 
		IIf(IsNull([qrySumOfTrackedHours].[SumOfTrackedHours], 0)=0,0,[qrySumOfTrackedHours].[SumOfTrackedHours]) AS SumOfHours
FROM tblStatus RIGHT JOIN qrySumOfTrackedHours 
RIGHT JOIN tblUser 
RIGHT JOIN tblTaskType 
RIGHT JOIN tblTask ON tblTaskType.ID = tblTask.TaskTypeID ON 
tblUser.ID = tblTask.AssignedToID ON qrySumOfTrackedHours.TaskID = tblTask.ID ON tblStatus.ID = tblTask.StatusID
WHERE tblStatus.IsCompleteOrCancelled=0
ORDER BY tblTask.AssignedToID