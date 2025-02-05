CREATE FUNCTION [dbo].fnGetProjectNameByTaskID
(
	@task_id int
	
)
RETURNS varchar(255)
AS
BEGIN
	
	Declare @project_id INT = dbo.fnGetProjectIDByTaskID(@task_id)
	Declare @project_name varchar(255) = (Select ProjectName from tblProject Where ID = @project_id)
	RETURN @project_name


END