

CREATE PROCEDURE [dbo].[spTASKNOTE_AddNew]
	@task_id int,
	@task_note varchar(max),
	@is_note_automated smallint,
	@update_employee_number varchar(10)
	
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @error_message nvarchar(max) = ''

	If (@task_id Is Null) OR (@task_id not in (select ID from tblTask))
		SET @error_message = @error_message + 'Note ID value is invalid.\r\n\'

	If (@task_note Is Null) OR (LEN(@task_note) = 0)
		SET @error_message = @error_message + 'Task Note value is required.\r\n\'

	if (@is_note_automated is null) OR (@is_note_automated not in (0, 1))
		SET @error_message = @error_message + 'IsNoteAutomated value is invalid.\r\n\'

	if @update_employee_number Not In (Select tblUser.EmployeeNumber from tblUser where tblUser.IsActive = 1 and tblUser.UserTypeID = 1)
		SET @error_message = @error_message + 'Invalid User.\r\n\'

	if @error_message <> ''
		begin
			RAISERROR(@error_message, 16, 1)
			RETURN -1
		end

	INSERT INTO tblTaskNotes(TaskID, TaskNote, IsNoteAutomated, UpdateUserID) Values (@task_id, @task_note, @is_note_automated, @update_employee_number)
	SELECT SCOPE_IDENTITY()
END