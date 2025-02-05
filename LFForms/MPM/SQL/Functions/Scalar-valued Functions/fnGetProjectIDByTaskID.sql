CREATE FUNCTION [dbo].fnGetProjectIDByTaskID
(
	@task_id int
)
RETURNS INT
AS
BEGIN
	Declare @project_id INT = (select ProjectID from tblTask where id = @task_id)
	RETURN IsNull(@project_id,0)
END