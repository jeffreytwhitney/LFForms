

CREATE PROCEDURE [dbo].[spTASK_CloneTask] 
	@task_id						INT,
	@new_task_name					VARCHAR(255),
	@new_task_type_id				INT,
	@operation							varchar(15),
	@assignee_id						INT,
	@employee_number				VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	Declare @project_id INT = dbo.fnGetProjectIDByTaskID(@task_id)
	DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);
	DECLARE @error_message nvarchar(max) = ''
	DECLARE @new_task_id int

	If (@task_id not in (select ID from tblTask))
		SET @error_message = @error_message + 'Task ID value is invalid.'+ @CRLF
	
	If (@project_id IS Null) 
	  SET @error_message = @error_message + 'Project ID value is invalid.'+ @CRLF
	
	if (@assignee_id not in (select ID from qryActiveUsers where UserType = 1))
	  SET @error_message = @error_message + 'Assignee value is invalid.'+ @CRLF

	IF (@new_task_name Is Null) Or (@new_task_name = '') 
	  SET @error_message = @error_message + 'Task Name value is invalid.'+ @CRLF
	
	If @new_task_type_id NOT IN (Select ID from tblTaskType)  
	  SET @error_message = @error_message + 'Task Type value is invalid.'+ @CRLF
  
	If (@employee_number not in (select EmployeeNumber from tblUser))
		SET @error_message = @error_message + 'Employee Number value is invalid.'+ @CRLF
	
	
	Declare @count_of_task_name INT = (Select Count(*) from tblTask WHERE TaskTypeID = @new_task_type_id 
																			AND Upper(trim(TaskName)) = upper(trim(@new_task_name)) 
																			AND ProjectID = @project_id
																			AND Operation = @operation)
	
	if @count_of_task_name > 0 
	 SET @error_message = @error_message + 'There is already a task of this name, type and op for this project.'+ @CRLF

	if @error_message <> ''
		begin
			RAISERROR(@error_message, 16, 1)
			RETURN 0
		end

	Declare @estimated_hours int = (Select AverageCompletionHours from tblTaskType where ID = @new_task_type_id)

	INSERT INTO tblTask (ProjectID, StatusID, TaskName, TicketNumber, DrawingNumber, DueDate, ScheduledDueDate, EstimatedHours,
						 TaskTypeID, AssignedToID, ManualDueDate, IUNumber, CustomerRev, ManufacturingRev, Operation)
	SELECT	ProjectID, 1, @new_task_name, TicketNumber, DrawingNumber, DueDate, ScheduledDueDate, @estimated_hours,
			@new_task_type_id, @assignee_id, ManualDueDate, IUNumber, CustomerRev, ManufacturingRev, @operation
	FROM tblTask
	WHERE ID = @task_id

	SET @new_task_id = SCOPE_IDENTITY()

	EXEC spPROJECT_SetActiveTaskCountByTaskID @task_id
	EXEC spJOBNUMBER_AddNew @project_id, @new_task_name, @new_task_type_id

	Select @new_task_id
END