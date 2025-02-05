

CREATE PROCEDURE [dbo].[spTASK_AddNew]
	@project_id 						int,
  @task_name							nvarchar(255),
  @drawing_number					nvarchar(255),
	@due_date								varchar(12),
	@scheduled_due_date			varchar(12),
  @task_type_id						int,
  @assigned_to_id					int,
  @manual_due_date				smallint,
	@customer_rev						nvarchar(15),
	@manufacturing_rev			nvarchar(15),
	@operation							nvarchar(15),
  @update_user_id					nvarchar(10)
AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @error_message nvarchar(max) = ''
		DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);

		if @project_id is null or @project_id not in (select ID from tblProject)
			begin
				SET @error_message = @error_message + 'Project ID is required.'+ @CRLF
			end

		if @task_name is null or @task_name = ''
			begin
				SET @error_message = @error_message + 'Task Name is required.'+ @CRLF
			end

		SET @drawing_number = ISNULL(@drawing_number, '')

				
		If (@operation Is Null) or (@operation = '') 
			SET @error_message = @error_message + 'Operation Is Empty.'+ @CRLF

		If (@manufacturing_rev Is Null) or (@manufacturing_rev = '') 
			SET @error_message = @error_message + 'Manufacturing Rev Is Empty.'+ @CRLF


		if @due_date is null	
			begin
				SET @error_message = @error_message + 'Due Date is required.'+ @CRLF
			end

		IF TRY_CAST(@due_date AS DATE) IS NULL
			SET @error_message = @error_message + 'Invalid Due Date.'+ @CRLF

		if @scheduled_due_date is null
			begin
				SET @error_message = @error_message + 'Scheduled Due Date is required.'+ @CRLF
			end
		
		IF TRY_CAST(@scheduled_due_date AS DATE) IS NULL
			SET @error_message = @error_message + 'Invalid Scheduled Due Date.'+ @CRLF

		if @task_type_id is null or @task_type_id not in (select ID from tblTaskType)
			begin
				SET @error_message = @error_message + 'Task Type ID is required.'+ @CRLF
			end

		if (@assigned_to_id IS NOT NULL) AND (@assigned_to_id NOT IN (select ID from tblUser))
			begin
				SET @error_message = @error_message + 'Assignee is invalid.'+ @CRLF
			end

		SET @manual_due_date = ISNULL(@manual_due_date, 0)
		IF @manual_due_date not in (0, 1)
			begin
				SET @error_message = @error_message + 'Invalid Manual Due Date Value.'+ @CRLF
			end

			
		if @update_user_id is null or @update_user_id not in (select EmployeeNumber from tblUser WHERE IsActive = 1)
			begin
				SET @error_message = @error_message + 'Invalid UserUpdateID.'+ @CRLF
			end

		if @error_message <> ''
			begin
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			end

		INSERT INTO [dbo].[tblTask]
							 ([ProjectID]
							 ,[StatusID]
							 ,[TaskName]
							 ,[DrawingNumber]
							 ,[DueDate]
							 ,[ScheduledDueDate]
							 ,[TaskTypeID]
							 ,[AssignedToID]
							 ,[ManualDueDate]
							 ,CustomerRev
							 ,ManufacturingRev
							 ,Operation
							 ,[UpdateUserID])
				 VALUES
							 (@project_id,
								1,
								@task_name,
								@drawing_number,
								@due_date,
								@scheduled_due_date,
								@task_type_id,
								@assigned_to_id,
								@manual_due_date,
								@customer_rev,
								@manufacturing_rev,
								@operation,
								@update_user_id)

		SELECT SCOPE_IDENTITY()
	END