
CREATE PROCEDURE [dbo].[spTASK_Update_SetScheduledDueDate]
	@task_id								INT,
	@scheduled_due_date 		Varchar(15),
	@employee_number				VARCHAR(10)
AS
	BEGIN

		SET NOCOUNT ON;
		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask)) RETURN
		If (@scheduled_due_date Is Null) RETURN
		If (@employee_number Is Null) or (@employee_number = '') RETURN
	

			Update tblTask 
			SET ScheduledDueDate = @scheduled_due_date,
				UpdateUserID = @employee_number
			WHERE ID = @task_id
	END

RETURN 0