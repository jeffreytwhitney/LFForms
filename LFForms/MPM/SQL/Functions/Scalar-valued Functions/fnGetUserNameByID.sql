CREATE FUNCTION dbo.[fnGetUserNameByID]
(
	@user_id						INT
)
RETURNS Varchar(512)
AS
BEGIN
	DECLARE @user_name Varchar(512) = (Select FName + ' ' + LName from tblUser where ID = @user_id)
	RETURN @user_name
END