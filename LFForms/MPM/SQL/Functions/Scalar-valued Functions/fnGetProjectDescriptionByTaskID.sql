CREATE FUNCTION [dbo].fnGetProjectDescriptionByTaskID
(
	@task_id int
	
)
RETURNS varchar(max)
AS
BEGIN
	
	Declare @project_id INT = dbo.fnGetProjectIDByTaskID(@task_id)
	Declare @project_description varchar(max) = (Select ProjectDescription from tblProject Where ID = @project_id)
	RETURN ISNULL(@project_description, '')


END