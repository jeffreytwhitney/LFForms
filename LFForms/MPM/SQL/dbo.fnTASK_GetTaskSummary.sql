USE [LF_RMS_COMMS_MPM]
GO

/****** Object: Table Valued Function [dbo].[fnTASK_GetTaskSummary] Script Date: 1/2/2025 10:31:26 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP FUNCTION [dbo].[fnTASK_GetTaskSummary];


GO
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

					Update @TaskSummary INNER JOIN dbo.qsubTaskSummary ON qsubTaskSummary.TaskTypeGroupName = @TaskSummary.TaskType 
					SET 
		



					FETCH NEXT FROM db_cursor INTO @site_id;
				END;

			CLOSE db_cursor;




		

		
		


		RETURN

	END
