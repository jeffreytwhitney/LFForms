



CREATE PROCEDURE [dbo].[spTASK_AddTimeToTask]
	@task_id								int,
	@assigned_to_id					int,
	@hours_to_add						Decimal(6,2),
	@time_entry_date				varchar(20)
AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @error_message nvarchar(max) = ''
		DECLARE @total_hours Decimal
		DECLARE @current_status INT
		Declare @employee_number VARCHAR(10)
		Declare @entry_date as Date

		set @entry_date = Cast(@time_entry_date as Date)
			
		if @assigned_to_id not in (Select ID from tblUSer where IsActive = 1 and UserTypeID = 1)
			BEGIN	
				SET @error_message = @error_message + 'Invalid Assignee.\r\n\' 
			END

		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
			BEGIN
				SET @error_message = @error_message + 'Note ID value is invalid.\r\n\'
			END
		
		if (@hours_to_add IS NULL) OR (@hours_to_add <= 0) 
		  BEGIN
				SET @error_message = @error_message + 'No Hours to Add.\r\n\'
			END

		if @error_message <> ''
			begin
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			end

		Set @employee_number = (Select EmployeeNumber from tblUser where id = @assigned_to_id)
		SET @entry_date = DATEADD(dd, 0, DATEDIFF(dd, 0, @entry_date))
		print '@entry_date:' + cast(@entry_date as varchar)
		
		SET @current_status = (Select StatusID from tblTask where ID = @task_id)

		DECLARE @existing_time_entry_id INT =	IsNull((SELECT ID 
																						FROM tblTaskTimeEntry 
																						WHERE		TaskID				=	@task_id 
																							AND		AssignedToID	=	@assigned_to_id 
																							AND		EntryDate			= @entry_date),0)
		
		
		DECLARE @existing_hours REAL = ISNull((SELECT Hours 
																	FROM tblTaskTimeEntry 
																	WHERE		TaskID				=	@task_id 
																		AND		AssignedToID	=	@assigned_to_id 
																		AND		EntryDate			= @entry_date),0)
		


		IF @existing_time_entry_id = 0
			BEGIN
				INSERT INTO tblTaskTimeEntry (AssignedToID, TaskID, Hours, EntryDate, UpdateUserID) 
					VALUES (@assigned_to_id, @task_id, @hours_to_add, @entry_date, @employee_number)
			END
		ELSE
			BEGIN
				Set @total_hours = @hours_to_add + @existing_hours
				Update tblTaskTimeEntry 
					SET Hours				= @total_hours,
						UpdateUserID	= @employee_number
					WHERE ID				= @existing_time_entry_id
			END


		IF @current_status = 1
			BEGIN
				Update tblTask Set StatusID = 2, DateStarted = GetDate(), UpdateUserID = @employee_number WHERE ID = @task_id
			END


	END