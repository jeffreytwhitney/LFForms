
CREATE VIEW [dbo].[qryScheduleData]
AS
SELECT	tblTaskScheduleData.TaskID, 
		tblTaskScheduleData.LinkedTableNameID, 
		tblTaskScheduleData.MachineName, 
		tblLinkedTableNames.ImportName, 
		IIf([qryCountOfIgnoredTasks].[CountOfTaskName]=0,0,1) AS IgnoreSchedule
FROM (tblLinkedTableNames INNER JOIN tblTaskScheduleData ON tblLinkedTableNames.ID = tblTaskScheduleData.LinkedTableNameID) 
INNER JOIN qryCountOfIgnoredTasks ON (tblTaskScheduleData.TaskID = qryCountOfIgnoredTasks.TaskID) 
AND (tblTaskScheduleData.LinkedTableNameID = qryCountOfIgnoredTasks.LinkedTableNameID);