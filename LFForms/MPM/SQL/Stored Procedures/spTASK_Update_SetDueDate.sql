CREATE PROCEDURE [spTASK_Update_SetDueDate]
	@task_id								INT,
	@due_date 							varchar(15),
	@employee_number				VARCHAR(10)
AS
	BEGIN

		SET NOCOUNT ON;
		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask)) RETURN
		If (@due_date Is Null) RETURN
		If (@employee_number Is Null) or (@employee_number = '') RETURN
	

			Update tblTask 
			SET DueDate = @due_date,
				UpdateUserID = @employee_number
			WHERE ID = @task_id
	END


RETURN 0