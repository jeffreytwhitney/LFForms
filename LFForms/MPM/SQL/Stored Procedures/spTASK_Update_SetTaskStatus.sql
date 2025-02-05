

CREATE PROCEDURE [dbo].[spTASK_Update_SetTaskStatus] 
	@task_id									INT,
	@task_status_id						INT,
	@employee_number					VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	DECLARE @error_message nvarchar(max) = ''
	If (@task_id not in (select ID from tblTask)) 
		SET @error_message = @error_message + 'Invalid Task ID.\r\n\'

	If (@task_status_id not in (select ID from tblStatus)) 
		SET @error_message = @error_message + 'Invalid Status ID.\r\n\'
	
	if @employee_number Not In (Select tblUser.EmployeeNumber from tblUser where tblUser.IsActive = 1 and tblUser.UserTypeID = 1)
		SET @error_message = @error_message + 'Invalid User.\r\n\'

	if @error_message <> ''
		begin
			RAISERROR(@error_message, 16, 1)
			RETURN 1
		end

	Declare @total_task_hours REAL = ISNULL((select SUM(Hours) from tblTaskTimeEntry Where TaskID = @task_id), 0 )

	If @task_status_id = 1
		Begin
			if @total_task_hours = 0 
				BEGIN
					SET @error_message = @error_message + 'Invalid status ID when hours > 0.\r\n\'
					RAISERROR(@error_message, 16, 1)
					RETURN -1
				END
			Update tblTask set StatusID = 1 where id = @task_id
			select 1
		END
	
	If @task_status_id = 2
		Begin
			Update tblTask set StatusID = 2 where id = @task_id
			select 2
		END
		
	If @task_status_id = 3
		Begin
			Update tblTask set StatusID = 3 where id = @task_id
			select 3
		END

  If @task_status_id = 4
		Begin
			Exec spTASK_Update_SetStatusComplete @task_id, @employee_number
			select 4
		End

	If @task_status_id = 5
		Begin
			Exec spTASK_Update_SetStatusCancelled @task_id, @employee_number
			select 5
		End
	
	If @task_status_id = 6
		Begin
			Update tblTask set StatusID = 6 where id = @task_id
			select 6
		END
		
	If @task_status_id = 7
		Begin
			Update tblTask set StatusID = 7 where id = @task_id
			select 7
		END
END