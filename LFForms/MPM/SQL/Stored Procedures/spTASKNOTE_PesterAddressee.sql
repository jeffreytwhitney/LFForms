

CREATE PROCEDURE [dbo].[spTASKNOTE_PesterAddressee]
	@task_id int,
	@email_message nvarchar(max),
	@sender_employee_number varchar(10)
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @error_message nvarchar(max) = ''
	DECLARE @task_note varchar(max) = ''
	DECLARE @isSenderAdmin int = 0
	DECLARE @assignee int
	DECLARE @assigneeName varchar(255)
	Declare @senderName varchar(255)

	
	If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
		SET @error_message = @error_message + 'Task ID value is invalid.\r\n\'

	If (@email_message Is Null) OR (LEN(@email_message) = 0)
		SET @error_message = @error_message + 'Task Note value is required.\r\n\'

	if @sender_employee_number Not In (Select tblUser.EmployeeNumber from tblUser where tblUser.IsActive = 1 and tblUser.IsAdmin = 1 and tblUser.UserTypeID = 1)
		SET @error_message = @error_message + 'Invalid Sender.\r\n\'

	Set @assignee = (Select ISNULL(qryTaskList.AssignedToID, 0) from qryTaskList where id = @task_id)
	if @assignee = 0
		SET @error_message = @error_message + 'No Assignee.\r\n\'

	Set @assigneeName = (Select qryActiveUsers.EmployeeName from qryActiveUsers where ID= @assignee)
	set @senderName = (Select qryActiveUsers.EmployeeName from qryActiveUsers where EmployeeNumber= @sender_employee_number)
	if @error_message <> ''
		begin
			RAISERROR(@error_message, 16, 1)
			RETURN 0
		end

	set @task_note = 'Request for Task Status Update was sent to the task assignee ' + @assigneeName 
  set @task_note = @task_note + ' from ' + @senderName + ' on ' + Cast(GetDate() as varchar(30)) + '.\r\n\r\n'
  set @task_note = @task_note + 'The following was the text of the email:\r\n' 
 set @task_note = @task_note + @email_message

	INSERT INTO tblTaskNotes(TaskID, TaskNote, IsNoteAutomated, UpdateUserID)
	VALUES (@task_id, @task_note, 1, @sender_employee_number)

	SELECT SCOPE_IDENTITY()
END