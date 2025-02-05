CREATE VIEW dbo.qryCountOfIgnoredTasks
AS
SELECT        dbo.tblTaskScheduleData.TaskID, dbo.tblTaskScheduleData.LinkedTableNameID, COUNT(dbo.tblIgnoreScheduleByTask.TaskName) AS CountOfTaskName
FROM            dbo.tblTaskScheduleData LEFT OUTER JOIN
                         dbo.tblIgnoreScheduleByTask ON dbo.tblTaskScheduleData.LinkedTableNameID = dbo.tblIgnoreScheduleByTask.ScheduleIDToIgnore AND dbo.tblTaskScheduleData.TaskID = dbo.tblIgnoreScheduleByTask.TaskID
GROUP BY dbo.tblTaskScheduleData.TaskID, dbo.tblTaskScheduleData.LinkedTableNameID
GO
