
CREATE FUNCTION dbo.[fnGetDepartmentNameByProjectID]
(
	@project_id int
)
RETURNS varchar(255)
AS
BEGIN
	DECLARE @dept_id INT = (Select DepartmentID from tblProject where ID = @project_id)
	Declare @department_name Varchar(255) = (select DepartmentName from tblDepartment where ID = @dept_id)
	RETURN IsNull(@department_name, '')
END