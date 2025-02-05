CREATE PROCEDURE [dbo].[spTASK_Update]
	@site_id								INT,
	@task_id								INT,
	@status_id 							INT,
	@task_name							Varchar(255),
	@drawing_number					varchar(255) = '',
	@due_date								varchar(12),
	@scheduled_due_date			varchar(12),
	@assigned_to_id					INT = NULL,
	@manual_due_date				smallint = 0,
	@customer_rev						varchar(15),
	@manufacturing_rev			varchar(15),
	@operation							varchar(15),
	@employee_number				VARCHAR(10)
AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @error_message nvarchar(max) = ''
		DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);
		DECLARE @task_type_id INT = (Select TaskTypeID from tblTask where ID = @task_id)
		Declare @date_started date

		If (@site_id Is Null) OR (@site_id not in (select ID from tblSite))
		  SET @error_message = @error_message + 'Site ID value is invalid.'+ @CRLF

		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
		  SET @error_message = @error_message + 'Task ID value is invalid.\r\n\'
		
		If (@status_id Is Null) OR (@status_id not in (select ID from tblStatus)) 
			SET @error_message = @error_message + 'Status ID value is invalid.\r\n\'
		
		If (@due_date Is Null) 
			SET @error_message = @error_message + 'Due Date is empty.\r\n\'
		
		If (@scheduled_due_date Is Null) 
			SET @error_message = @error_message + 'Scheduled Due Date is empty.\r\n\'
		
		If ((@assigned_to_id IS NOT NULL) AND (@assigned_to_id NOT IN (Select ID from tblUser where SiteID = @site_id and IsActive = 1 and UserTypeID = 1))) 
			SET @error_message = @error_message + 'Invalid Assignee.\r\n\'
		
		If (@employee_number Is Null) or (@employee_number NOT IN (Select EmployeeNumber from tblUser where SiteID = @site_id and IsActive = 1 and UserTypeID = 1)) 
			SET @error_message = @error_message + 'Invalid Employee Number.\r\n\'
		
		If (@operation Is Null) or (@operation = '') 
			SET @error_message = @error_message + 'Operation Is Empty.\r\n\'

		If (@manufacturing_rev Is Null) or (@manufacturing_rev = '') 
			SET @error_message = @error_message + 'Manufacturing Rev Is Empty.\r\n\'

		Declare @existing_status_id INT = (select StatusID from tblTask where id = @task_id)
		IF (@existing_status_id in (4,5)) 
			SET @error_message = @error_message + 'Task Is Already Closed.\r\n\'

		Declare @project_id INT = (select ProjectID from tblTask where id = @task_id)
		Declare @count_of_task_name INT = (Select Count(*) from tblTask 
																					WHERE ProjectID = @project_id 
																						AND Upper(Trim(TaskName)) = upper(trim(@task_name))
																						AND TaskTypeID = @task_type_id
																						AND ID <> @task_id
																						AND Operation = @operation)
	  IF (@count_of_task_name > 0) 
			SET @error_message = @error_message + 'There is another task with the same project, type, op and name.\r\n\'
		
		Declare @total_task_hours REAL = (select ISNULL(SUM(Hours), 0 ) from tblTaskTimeEntry Where TaskID = @task_id)
		If ((@status_id = 1) AND (@total_task_hours > 0)) 
			SET @error_message = @error_message + 'Task has hours. You cannot set it to Not Started.\r\n\' 

		if @error_message <> ''
				begin
					RAISERROR(@error_message, 16, 1)
					RETURN -1
				end

		Update tblTask 
			SET StatusID =					@status_id,
				TaskName =						Upper(trim(@task_name)),
				DrawingNumber =				Upper(trim(ISNULL(@drawing_number, ''))), 
				DueDate =							@due_date, 
				ScheduledDueDate =		@scheduled_due_date,
				AssignedToID =				@assigned_to_id,
				ManualDueDate =				ISNULL(@manual_due_date, 0),
				CustomerRev =					Upper(trim(ISNULL(@customer_rev, ''))),
				ManufacturingRev =		Upper(trim(@manufacturing_rev)),
				Operation =						Upper(trim(@operation)),
				UpdateUserID =				@employee_number
			WHERE ID = @task_id

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