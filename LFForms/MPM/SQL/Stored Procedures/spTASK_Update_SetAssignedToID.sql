CREATE PROCEDURE [spTASK_Update_SetAssignedToID]
	@task_id								INT,
	@assignee_id						INT,
	@employee_number				VARCHAR(10)
AS
	BEGIN
		SET NOCOUNT ON;
		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask)) RETURN
		If (@employee_number Is Null) or (@employee_number = '') RETURN
	
		If (@assignee_id Is Null) OR (@assignee_id not in (select ID from tblUser)) 
			Update tblTask 
			SET AssignedToID = Null,
				UpdateUserID = @employee_number
			WHERE ID = @task_id
		Else
			Update tblTask 
			SET AssignedToID = @assignee_id,
				UpdateUserID = @employee_number
			WHERE ID = @task_id
	END

RETURN 0