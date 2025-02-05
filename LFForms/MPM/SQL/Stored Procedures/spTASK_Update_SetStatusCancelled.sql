

CREATE PROCEDURE [dbo].[spTASK_Update_SetStatusCancelled] 
	@task_id						INT,
	@employee_number				VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	DECLARE @error_message nvarchar(max) = ''
	if @employee_number Not In (Select tblUser.EmployeeNumber from tblUser where tblUser.IsActive = 1 and tblUser.UserTypeID = 1)
		SET @error_message = @error_message + 'Invalid User.\r\n\'
    
	if @error_message <> ''
		begin
			RAISERROR(@error_message, 16, 1)
			RETURN 0
		end

	Update tblTask Set StatusID = 5
	, DateCompleted = GetDate()
	, UpdateUserID = @employee_number
	WHERE ID = @task_id

	EXEC spProject_SetActiveTaskCountByTaskID @task_id
END