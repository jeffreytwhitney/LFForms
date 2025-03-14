USE [LF_RMS_COMMS_MPM]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [spTASK_GroupUpdate]
  @site_id								INT,
	@task_id								INT,
	@op_number							varchar(15),
	@task_type_id						INT,
	@status_id 							INT,
	@due_date								varchar(12),
	@scheduled_due_date			varchar(12),
	@assigned_to_id					INT = NULL,
	@manual_due_date				smallint = 0,
	
	@employee_number				VARCHAR(10)
AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @error_message nvarchar(max) = ''
		DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);
		Declare @date_started date
		DECLARE @sql varchar(max) = '';
		Declare @is_set_added as smallint = 0

		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
		  SET @error_message = @error_message + 'Task ID value is invalid.\r\n\'
		
		If (@status_id Is NOT Null) AND (@status_id not in (select ID from tblStatus)) 
			SET @error_message = @error_message + 'Status ID value is invalid.\r\n\'

		If ((@assigned_to_id IS NOT NULL) AND (@assigned_to_id NOT IN (Select ID from tblUser where SiteID = @site_id and IsActive = 1 and UserTypeID = 1))) 
			SET @error_message = @error_message + 'Invalid Assignee.\r\n\'
		
		If (@employee_number Is Null) or (@employee_number NOT IN (Select EmployeeNumber from tblUser where SiteID = @site_id and IsActive = 1 and UserTypeID = 1)) 
			SET @error_message = @error_message + 'Invalid Employee Number.\r\n\'

		if @error_message <> ''
				begin
					RAISERROR(@error_message, 16, 1)
					RETURN -1
				end

		set @sql = 'Update tblTask '

		if (@task_id Is NOT Null) AND (@task_id in (select ID from tblTask))
			BEGIN
				set @sql = @sql + 'SET StatusID = ' + cast(@status_id as varchar)
				set @is_set_added = 1
			END



			if (@task_type_id Is NOT Null) AND (@task_type_id in (select ID from tblTaskType))
			BEGIN
				if @is_set_added = 1
					BEGIN
						set @sql = @sql + ', TaskTypeID = ' + cast(@task_type_id as varchar)
					END
				else
					BEGIN
						set @sql = @sql + 'SET TaskTypeID = ' + cast(@task_type_id as varchar)
						set @is_set_added = 1
					END
			END


			if (@op_number Is NOT Null)
			BEGIN
				if @is_set_added = 1
					BEGIN
						set @sql = @sql + ', Operation = Upper(trim(''' + @op_number + '''))'
					END
				else
					BEGIN
						set @sql = @sql + 'SET Operation = Upper(trim(''' + @op_number + '''))'
						set @is_set_added = 1
					END
			END

			if (@due_date Is NOT Null)
			BEGIN
				if @is_set_added = 1
					BEGIN
						set @sql = @sql + ', DueDate = ''' + @due_date + ''''
					END
				else
					BEGIN
						set @sql = @sql + 'SET DueDate = ''' + @due_date + ''''
						set @is_set_added = 1
					END
			END

			if (@scheduled_due_date Is NOT Null)
			BEGIN
				if @is_set_added = 1
					BEGIN
						set @sql = @sql + ', ScheduledDueDate = ''' + @scheduled_due_date + ''''
					END
				else
					BEGIN
						set @sql = @sql + 'SET ScheduledDueDate = ''' + @scheduled_due_date + ''''
						set @is_set_added = 1
					END
			END

			if (@assigned_to_id Is NOT Null)
			BEGIN
				if @is_set_added = 1
					BEGIN
						set @sql = @sql + ', AssignedToID = ' + cast(@assigned_to_id as varchar)
					END
				else
					BEGIN
						set @sql = @sql + 'SET AssignedToID = ' + cast(@assigned_to_id as varchar)
						set @is_set_added = 1
					END
			END


			if (@manual_due_date Is NOT Null)
			BEGIN
				if @is_set_added = 1
					BEGIN
						set @sql = @sql + ', ManualDueDate = ' + cast(@manual_due_date as varchar)
					END
				else
					BEGIN
						set @sql = @sql + 'SET ManualDueDate = ' + cast(@manual_due_date as varchar)
						set @is_set_added = 1
					END
			END

			if @is_set_added = 1
				BEGIN
					set @sql = @sql + ', UpdateUserID = ''' + @employee_number + ''''
				END
			else
				BEGIN
					set @sql = @sql + 'SET UpdateUserID = ''' + @employee_number + ''''
				END




			SET StatusID = @status_id,
				TaskName =						Upper(trim(@task_name)),
				DueDate =							@due_date, 
				ScheduledDueDate =		@scheduled_due_date,
				AssignedToID =				@assigned_to_id,
				ManualDueDate =				ISNULL(@manual_due_date, 0),
				Operation =						Upper(trim(@op_number)),
				UpdateUserID =				@employee_number
			set @sql = @sql + ' WHERE ID = @task_id'

		IF (@status_id in (4,5)) 
			BEGIN
				Update tblTask Set DateCompleted = GetDate() Where ID = @task_id
			END
		
		Set @date_started = (Select DateStarted from tblTask Where ID = @task_id)
		if (@status_id = 2 and @date_started is null)
			BEGIN
				Update tblTask Set DateStarted = GetDate() Where ID = @task_id
			END


		EXEC spProject_SetActiveTaskCountByTaskID @task_id
		Select @task_id
	END
GO


