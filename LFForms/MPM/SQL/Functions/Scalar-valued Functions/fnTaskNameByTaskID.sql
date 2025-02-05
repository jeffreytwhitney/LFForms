CREATE FUNCTION [dbo].fnTaskNameByTaskID
(
	@task_id int
)
RETURNS varchar(255)
AS
BEGIN
	Declare @task_name varchar(255) = Upper(Trim((Select TaskName from tblTask where ID = @task_id)))
	RETURN IsNull(@task_name, '')
END