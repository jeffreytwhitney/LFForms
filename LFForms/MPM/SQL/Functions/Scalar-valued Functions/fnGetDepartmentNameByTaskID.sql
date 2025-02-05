CREATE FUNCTION dbo.[fnGetDepartmentNameByTaskID]
(
	@task_id int
)
RETURNS varchar(255)
AS
BEGIN
	Declare @project_id INT = (select ProjectID from tblTask Where ID = @task_id)
	DECLARE @dept_id INT = (Select DepartmentID from tblProject where ID = @project_id)
	Declare @department_name Varchar(255) = (select DepartmentName from tblDepartment where ID = @dept_id)
	RETURN IsNull(@department_name, '')
END