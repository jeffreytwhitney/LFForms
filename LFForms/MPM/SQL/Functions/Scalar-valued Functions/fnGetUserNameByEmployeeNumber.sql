

CREATE FUNCTION [dbo].[fnGetUserNameByEmployeeNumber]
(
	@employee_number						VARCHAR(10)
)
RETURNS Varchar(512)
AS
BEGIN
	DECLARE @user_name Varchar(512) = (Select LName + ', ' + FName from tblUser where EmployeeNumber = @employee_number)
	RETURN @user_name
END