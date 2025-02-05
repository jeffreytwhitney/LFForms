
CREATE FUNCTION [dbo].[fnGetQEEmailAddressByTaskID]
(
	@task_id INT
)
RETURNS varchar(255)
AS
BEGIN
	Declare @qe_email_address varchar(255) = (SELECT tblUser.EMailAddress 
																						 FROM tblUser INNER JOIN (tblProject INNER JOIN tblTask ON tblProject.ID = tblTask.ProjectID) 
																						 ON tblUser.ID = tblProject.SecondaryProjectOwnerID 
																						 WHERE tblTask.ID = @task_id)
	
	RETURN @qe_email_address
END