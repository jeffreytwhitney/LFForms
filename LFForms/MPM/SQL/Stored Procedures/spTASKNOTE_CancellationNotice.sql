




CREATE PROCEDURE [dbo].[spTASKNOTE_CancellationNotice]
	@task_id int,
	@email_message nvarchar(max),
	@sender_employee_number varchar(10)
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @error_message nvarchar(max) = ''
	DECLARE @task_note varchar(max) = ''
	DECLARE @qualityEngineer int
	DECLARE @qeName varchar(255)
	Declare @senderName varchar(255)
	DECLARE @CRLF NVARCHAR(2) = CHAR(13) + CHAR(10);
	
	If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
		SET @error_message = @error_message + 'Task ID value is invalid.'+ @CRLF

	If (@email_message Is Null) OR (LEN(@email_message) = 0)
		SET @error_message = @error_message + 'Email Message value is required.'+ @CRLF

	if @sender_employee_number Not In (Select tblUser.EmployeeNumber from tblUser where tblUser.IsActive = 1 and tblUser.UserTypeID = 1)
		SET @error_message = @error_message + 'Invalid Sender.'+ @CRLF

	Set @qualityEngineer = (Select ISNULL(qryTaskList.SecondaryProjectOwnerID, 0) from qryTaskList where id = @task_id)
	if @qualityEngineer = 0
		SET @error_message = @error_message + 'No QE.'+ @CRLF

	Set @qeName = (Select qryActiveUsers.EmployeeName from qryActiveUsers where ID= @qualityEngineer)
	set @senderName = (Select qryActiveUsers.EmployeeName from qryActiveUsers where EmployeeNumber= @sender_employee_number)
	if @error_message <> ''
		begin
			RAISERROR(@error_message, 16, 1)
			RETURN 0
		end

	set @task_note = 'Notice of task cancellation was sent to the Quality Engineer ' + @qeName 
  set @task_note = @task_note + ' from ' + @senderName + ' on ' + Cast(GetDate() as varchar(30)) + '.'+ @CRLF+ @CRLF
  set @task_note = @task_note + 'The following was the text of the email:'+ @CRLF 
 set @task_note = @task_note + @email_message

	INSERT INTO tblTaskNotes(TaskID, TaskNote, IsNoteAutomated, UpdateUserID)
	VALUES (@task_id, @task_note, 1, @sender_employee_number)

	SELECT SCOPE_IDENTITY()
END