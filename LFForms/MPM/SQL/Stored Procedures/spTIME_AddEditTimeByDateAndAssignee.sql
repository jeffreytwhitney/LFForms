

CREATE PROCEDURE [dbo].spTIME_AddEditTimeByDateAndAssignee
	@task_id smallint = 0,
	@time_entry_id int = 0,
	@assignee_id int = 0,
	@hours_to_add	Decimal(6,2),
	@time_entry_date varchar(12),
	@employee_number				VARCHAR(10)

AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);
		DECLARE @recordCount INT = 0
		DECLARE @error_message nvarchar(max) = ''
		DECLARE @sql varchar(max) = '';
		DECLARE @new_time_entry_id int
		
		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
			SET @error_message = @error_message + 'Task ID value is invalid.\r\n\'

		If (@assignee_id Is Null) OR (@assignee_id not in (select ID from tblUser where tblUser.UserTypeID = 1 and tblUser.IsActive = 1))
			SET @error_message = @error_message + 'Assignee value is invalid.'+ @CRLF
		
		IF TRY_CAST(@time_entry_date AS DATE) IS NULL
			SET @error_message = @error_message + 'Invalid date.'+ @CRLF
			  
		If (@employee_number not in (select EmployeeNumber from tblUser where IsActive = 1 and UserTypeID = 1))
			SET @error_message = @error_message + 'Employee Number value is invalid.'+ @CRLF

		IF @error_message <> ''
			BEGIN
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			END

		if @time_entry_id Is Null
		/* If there's a record in the database, set the time_entry_id to that value*/
			BEGIN
				SET @recordCount = (Select Count(*) from tblTaskTimeEntry Where TaskID = @task_id AND AssignedToID = @assignee_id AND EntryDate = @time_entry_date)
				if @recordCount > 0
					BEGIN
						SET @time_entry_id = (Select ID from tblTaskTimeEntry Where TaskID = @task_id AND AssignedToID = @assignee_id AND EntryDate = @time_entry_date)
					END
			END
		
		if @time_entry_id = 0
			BEGIN
				print 'New entry'
				 INSERT into tblTaskTimeEntry(AssignedToID, EntryDate, TaskID, Hours, UpdateUserID) Values (@assignee_id, @time_entry_date, @task_id, @hours_to_add, @employee_number)
				 set @new_time_entry_id =  SCOPE_IDENTITY()
			END
		Else
			BEGIN
			print 'Update entry'
				Update tblTaskTimeEntry Set Hours = @hours_to_add, UpdateUserID = @employee_number WHERE ID = @time_entry_id
				Set @new_time_entry_id = @time_entry_id
			END

			Select @new_time_entry_id

	END