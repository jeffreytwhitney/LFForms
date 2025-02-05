
CREATE PROCEDURE [dbo].[spIMPORT_UpdateTaskScheduleData]
AS
	
	DECLARE @task_id INT;
	DECLARE @linked_table_name INT;
	DECLARE @machine_name VARCHAR(255);

	DECLARE db_cursor CURSOR FOR SELECT tblTask.ID, qryDistinctMachineNames.TaskName, qryDistinctMachineNames.LinkedTableNameID, qryDistinctMachineNames.MachineName 
																FROM qryDistinctMachineNames 
																INNER JOIN tblTask ON qryDistinctMachineNames.TaskName = tblTask.TaskName;
	OPEN db_cursor;

	FETCH NEXT FROM db_cursor INTO @task_id, @linked_table_name, @machine_name;
		WHILE @@FETCH_STATUS = 0  
			BEGIN  
				Insert into tblTaskScheduleData (TaskID, LinkedTableNameID, MachineName) Values (@task_id, @linked_table_name, @machine_name)
				FETCH NEXT FROM db_cursor INTO @task_id, @linked_table_name, @machine_name;
			END
	CLOSE db_cursor;
	DEALLOCATE db_cursor;
	
RETURN 0