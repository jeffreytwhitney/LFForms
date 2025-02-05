CREATE FUNCTION [dbo].fnGetStatusNameByTaskID
(
	@task_id int
	
)
RETURNS varchar(255)
AS
BEGIN
	
	Declare @status_id INT = (Select StatusID from tblTask where ID = @task_id)
	Declare @status_name varchar(255) = (Select Status from tblStatus Where ID = @status_id)
	RETURN @status_name


END