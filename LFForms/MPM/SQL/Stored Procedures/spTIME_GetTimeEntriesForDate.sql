CREATE PROCEDURE [dbo].spTIME_GetTimeEntriesForDate
	@site_id smallint = 0,
	@assignee_id int = 0,
	@time_entry_date varchar(12),
	@task_name varchar(255) = '',
	@status_id int = 0,
	@tasktype_id int = 0,
	@exclude_waiting_on_part smallint = 0,
	@include_not_scheduled smallint = 0 

AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);
		DECLARE @error_message nvarchar(max) = ''
		DECLARE @sql varchar(max) = '';


		If (@assignee_id Is Null) OR (@assignee_id not in (select ID from tblUser where tblUser.UserTypeID = 1 and tblUser.IsActive = 1))
			SET @error_message = @error_message + 'Assignee value is invalid.'+ @CRLF
		
		IF TRY_CAST(@time_entry_date AS DATE) IS NULL
			SET @error_message = @error_message + 'Invalid date.'+ @CRLF

		IF @error_message <> ''
			BEGIN
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			END

		SET @sql = 'SELECT tblTaskTimeEntry.ID, qryActiveTasksByPriority.TaskID, qryActiveTasksByPriority.TaskName, 
								qryActiveTasksByPriority.TaskType, qryActiveTasksByPriority.StatusID, 
								tblTaskTimeEntry.Hours, tblTaskTimeEntry.EntryDate, 
								qryActiveTasksByPriority.Status, 
								qryActiveTasksByPriority.ScheduledDueDate, 
								qryActiveTasksByPriority.DueDate 
								FROM tblTaskTimeEntry INNER JOIN qryActiveTasksByPriority 
								ON tblTaskTimeEntry.TaskID = qryActiveTasksByPriority.TaskID WHERE tblTaskTimeEntry.EntryDate = ''' + @time_entry_date + ''''
		SET @sql = @sql + ' AND qryActiveTasksByPriority.CreatedTimestamp <= ''' + @time_entry_date + ' 11:59:59 PM'''
		SET @sql = @sql + ' AND tblTaskTimeEntry.AssignedToID = ' + Cast(@assignee_id as varchar)


		IF (@task_name <> '') BEGIN SET @sql = @sql + ' AND qryActiveTasksByPriority.TaskName LIKE ''%' + @task_name + '%''' END
			
		IF (@status_id > 0) BEGIN SET @sql = @sql + ' AND qryActiveTasksByPriority.StatusID = ' + Cast(@status_id as varchar) END

		IF @tasktype_id > 0 BEGIN SET @sql = @sql + ' AND qryActiveTasksByPriority.TaskTypeID = ' + Cast(@tasktype_id as varchar) END


		SET @sql = @sql + ' UNION ALL SELECT Null AS ID, qryActiveTasksByPriority.TaskID, qryActiveTasksByPriority.TaskName, 
												qryActiveTasksByPriority.TaskType, qryActiveTasksByPriority.StatusID, 0 AS Hours, 
												''' + @time_entry_date + ''' AS EntryDate, qryActiveTasksByPriority.Status, 
												qryActiveTasksByPriority.ScheduledDueDate, qryActiveTasksByPriority.DueDate 
											  FROM qryActiveTasksByPriority WHERE qryActiveTasksByPriority.CreatedTimestamp <= ''' + @time_entry_date + ' 11:59:59 PM'''
		SET @sql = @sql + ' AND qryActiveTasksByPriority.AssignedToID = ' + Cast(@assignee_id as varchar)


		IF (@task_name <> '') BEGIN SET @sql = @sql + ' AND qryActiveTasksByPriority.TaskName LIKE ''%' + @task_name + '%''' END
			
		IF (@status_id > 0) BEGIN SET @sql = @sql + ' AND qryActiveTasksByPriority.StatusID = ' + Cast(@status_id as varchar) END

    IF (@include_not_scheduled is null or @include_not_scheduled = 0) BEGIN SET @sql = @sql + ' AND StatusID <> 7'; END

		IF @exclude_waiting_on_part = 1 BEGIN SET @sql = @sql + ' AND StatusID <> 3'; END

		IF @tasktype_id > 0 BEGIN SET @sql = @sql + ' AND qryActiveTasksByPriority.TaskTypeID = ' + Cast(@tasktype_id as varchar) END

		SET @sql = @sql + ' AND qryActiveTasksByPriority.TaskID Not In 
												(SELECT tblTaskTimeEntry.TaskID FROM tblTaskTimeEntry 
												WHERE tblTaskTimeEntry.EntryDate=''' + @time_entry_date + ''' AND tblTaskTimeEntry.AssignedToID = 10) 
												ORDER BY ScheduledDueDate, DueDate, TaskName '

		print @sql
		Exec(@sql);

	END