CREATE PROCEDURE [spTASK_Update_SetTaskName]
	@task_id								INT,
	@task_name 							VARCHAR(255),
	@employee_number				VARCHAR(10)
AS
	BEGIN
		SET NOCOUNT ON;
		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask)) RETURN
		If (@task_name Is Null) or (@task_name = '') RETURN
		If (@employee_number Is Null) or (@employee_number = '') RETURN
	
		Declare @project_id INT = (select ProjectID from tblTask where id = @task_id)
		Declare @task_type_id INT = (Select TaskTypeID from tblTask where id = @task_id)
		Declare @count_of_task_name INT = (Select Count(*) from tblTask 
																					WHERE ProjectID = @project_id 
																						AND Upper(Trim(TaskName)) = upper(trim(@task_name))
																						AND TaskTypeID = @task_type_id
																						AND ID <> @task_id)
		IF @count_of_task_name = 0
			Update tblTask 
			SET TaskName = upper(trim(@task_name)),
				UpdateUserID = @employee_number
			WHERE ID = @task_id
 END