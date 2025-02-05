
CREATE FUNCTION [dbo].[fnUserEmailNameByID]
(
	@user_id						INT
)
RETURNS Varchar(512)
AS
BEGIN
	DECLARE @assignee_email Varchar(512) = (Select EMailAddress from tblUser where ID = @user_id)
	RETURN @assignee_email
END