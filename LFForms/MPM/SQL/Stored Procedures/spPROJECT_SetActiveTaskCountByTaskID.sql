
CREATE PROCEDURE [spPROJECT_SetActiveTaskCountByTaskID] 
	@task_id						INT
AS
BEGIN

	SET NOCOUNT ON;
	Declare @project_id INT
	Declare @count_of_active_tasks INT
	
	Set @project_id = (Select ProjectID from tblTask where id = @task_id)
    
	
	SET @count_of_active_tasks = (SELECT Count(tblTask.ID) AS CountOfID 
									FROM tblTask 
									WHERE tblTask.StatusID In (Select ID from tblStatus Where IsCompleteOrCancelled = 0) 
									GROUP BY tblTask.ProjectID 
									HAVING tblTask.ProjectID=@project_id)

	Update tblProject set CountOfActiveTasks = @count_of_active_tasks 
	Where ID = @project_id AND (tblProject.CountOfActiveTasks <> @count_of_active_tasks or tblProject.CountOfActiveTasks is Null)
	
END