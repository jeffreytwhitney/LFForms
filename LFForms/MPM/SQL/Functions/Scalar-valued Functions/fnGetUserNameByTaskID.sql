CREATE FUNCTION dbo.fnGetUserNameByTaskID
(
	@task_id INT
)
RETURNS varchar(512)
AS
BEGIN
	
	DECLARE @user_name Varchar(512) = (Select FName + ' ' + LName 
																		FROM tblTask INNER JOIN tblUser ON tblTask.AssignedToID = tblUser.ID
																		WHERE tblTask.ID=@task_id)
	
	RETURN @user_name
END