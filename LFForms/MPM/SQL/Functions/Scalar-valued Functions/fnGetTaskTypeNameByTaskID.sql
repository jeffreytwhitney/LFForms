CREATE FUNCTION [dbo].fnGetTaskTypeNameByTaskID
(
	@task_id int
	
)
RETURNS varchar(255)
AS
BEGIN
	
	Declare @task_type_id INT = (select taskTypeID from tblTask where ID = @task_id)
	Declare @task_type_name varchar(255) = (Select TaskType from tblTaskType Where ID = @task_type_id)
	RETURN @task_type_name


END