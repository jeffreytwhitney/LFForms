CREATE FUNCTION [dbo].fnTASK_GetTaskSummary()
	RETURNS  @TaskSummary TABLE
						( SiteID INT,
							TaskType NVARCHAR(50),
							NotStartedCount INT,
							StartedCount INT,
							WaitingCount INT,
							NotScheduledCount INT,
							UnassignedCount INT,
							TotalByType INT)	
AS
	BEGIN
		
		
		DECLARE @site_id	INT;
		DECLARE @task_count INT;


		DECLARE db_cursor CURSOR FOR SELECT ID from tblSite;
		OPEN db_cursor;
		FETCH NEXT FROM db_cursor INTO @site_id;
			WHILE @@FETCH_STATUS = 0  
				BEGIN  


					INSERT INTO @TaskSummary Select @site_id, TaskTypeGroupName, 0, 0, 0, 0, 0, 0 FROM tblTaskTypeGroup
					INSERT INTO @TaskSummary Select @site_id, 'TOTAL', 0, 0, 0, 0, 0, 0

					Update @TaskSummary SET NotStartedCount = qsubTaskSummary.CountOfTaskGroup
																FROM @TaskSummary as ts1
																INNER JOIN qsubTaskSummary ON ts1.SiteID = qsubTaskSummary.SiteID 
																AND ts1.TaskType = qsubTaskSummary.TaskTypeGroupName
																WHERE qsubTaskSummary.StatusID = 1
		
					Update @TaskSummary SET StartedCount = qsubTaskSummary.CountOfTaskGroup
																FROM @TaskSummary as ts1
																INNER JOIN qsubTaskSummary ON ts1.SiteID = qsubTaskSummary.SiteID 
																AND ts1.TaskType = qsubTaskSummary.TaskTypeGroupName
																WHERE qsubTaskSummary.StatusID = 2

					Update @TaskSummary SET WaitingCount = qsubTaskSummary.CountOfTaskGroup
																FROM @TaskSummary as ts1
																INNER JOIN qsubTaskSummary ON ts1.SiteID = qsubTaskSummary.SiteID 
																AND ts1.TaskType = qsubTaskSummary.TaskTypeGroupName
																WHERE qsubTaskSummary.StatusID IN (3,8,9)

					
					Update @TaskSummary SET NotScheduledCount = qsubTaskSummary.CountOfTaskGroup
																FROM @TaskSummary as ts1
																INNER JOIN qsubTaskSummary ON ts1.SiteID = qsubTaskSummary.SiteID 
																AND ts1.TaskType = qsubTaskSummary.TaskTypeGroupName
																WHERE qsubTaskSummary.StatusID =7


					Update @TaskSummary SET UnassignedCount = qryUnassignedTasksByTaskTypeGroup.CountOfUnassigned
																FROM @TaskSummary as ts1
																INNER JOIN qryUnassignedTasksByTaskTypeGroup ON ts1.SiteID = qryUnassignedTasksByTaskTypeGroup.SiteID
																AND ts1.TaskType = qryUnassignedTasksByTaskTypeGroup.TaskTypeGroupName


					UPDATE @TaskSummary SET NotStartedCount = 0 WHERE NotStartedCount IS NULL 
					UPDATE @TaskSummary SET StartedCount = 0 WHERE StartedCount IS NULL 
					UPDATE @TaskSummary SET WaitingCount = 0 WHERE WaitingCount IS NULL 
					UPDATE @TaskSummary SET NotScheduledCount = 0 WHERE NotScheduledCount IS NULL
					UPDATE @TaskSummary SET UnassignedCount = 0 WHERE UnassignedCount IS NULL 

					UPDATE @TaskSummary SET TotalByType = NotStartedCount + StartedCount + WaitingCount + NotScheduledCount
					UPDATE @TaskSummary SET TotalByType = 0 WHERE TotalByType IS NULL 
					
					UPDATE @TaskSummary SET NotStartedCount = (Select SUM(NotStartedCount) From @TaskSummary WHERE SiteID = @site_id) WHERE TaskType = 'TOTAL' AND SiteID = @site_id
					UPDATE @TaskSummary SET StartedCount = (Select SUM(StartedCount) From @TaskSummary WHERE SiteID = @site_id) WHERE TaskType = 'TOTAL' AND SiteID = @site_id
					UPDATE @TaskSummary SET WaitingCount = (Select SUM(WaitingCount) From @TaskSummary WHERE SiteID = @site_id) WHERE TaskType = 'TOTAL' AND SiteID = @site_id
					UPDATE @TaskSummary SET NotScheduledCount = (Select SUM(NotScheduledCount) From @TaskSummary WHERE SiteID = @site_id) WHERE TaskType = 'TOTAL' AND SiteID = @site_id
					
					UPDATE @TaskSummary SET UnassignedCount = (Select SUM(UnassignedCount) From @TaskSummary WHERE SiteID = @site_id) WHERE TaskType = 'TOTAL' AND SiteID = @site_id
					
					
					UPDATE @TaskSummary SET TotalByType = (Select SUM(TotalByType) From @TaskSummary WHERE SiteID = @site_id) WHERE TaskType = 'TOTAL' AND SiteID = @site_id



					FETCH NEXT FROM db_cursor INTO @site_id;
					
				END;

			CLOSE db_cursor;




		

		
		


		RETURN

	END