


CREATE PROCEDURE [dbo].[spJOBNUMBER_AddNew] 
	@project_id						INT,
	@task_name						VARCHAR(255),
	@task_type_id					INT
AS
BEGIN

	SET NOCOUNT ON;
	Declare @existing_job_number INT = (Select ID from tblJobNumber where ProjectID = @project_id and Upper(Trim(TaskName)) = Upper(Trim(@task_name)))
	Declare @is_onefactory_task_type smallint = (select RequiresJobNumber from tblTaskType where ID = @task_type_id)
	if (@existing_job_number Is Null) AND (@is_onefactory_task_type = 1)
		Begin
			Declare @available_job_number varchar(255) = (Select JobNumber from qryAvailableJobNumbers Where ID = (Select Min(ID) from qryAvailableJobNumbers))
			INSERT INTO tblJobNumber (ProjectID, TaskName, JobNumber) Values (@project_id, @task_name, @available_job_number)
		End


END