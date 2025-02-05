
CREATE PROCEDURE [dbo].[spIMPORT_UpdateTaskFromImportTable]
	@userEmployeeNumber VarChar(10)
AS
	
	DECLARE @task_name varchar(255)
	DECLARE @number_of_updated_records INT
	DECLARE @imported_due_date Date
	DECLARE @previous_working_date Date
	DECLARE @current_scheduled_due_date Date
	DECLARE @current_due_date Date
    
	DECLARE @task_status INT
	DECLARE @task_id INT

	DECLARE db_cursor CURSOR FOR	SELECT tblImport.TaskName, tblImport.DueDate AS ImportDueDate, tblTask.DueDate AS TaskDueDate, 
																			tblTask.ScheduledDueDate, tblTask.StatusID, tblTask.ID FROM tblStatus 
																INNER JOIN (tblTask INNER JOIN tblImport ON tblTask.TaskName = tblImport.TaskName) 
																ON tblStatus.ID = tblTask.StatusID 
																WHERE tblStatus.IsCompleteOrCancelled=0 AND tblTask.ManualDueDate=0

	OPEN db_cursor
	FETCH NEXT FROM db_cursor INTO @task_name, @imported_due_date, @current_due_date, @current_scheduled_due_date, @task_status, @task_id;
		WHILE @@FETCH_STATUS = 0  
			BEGIN  
				SET @previous_working_date = dbo.fnAddWeekdays(@imported_due_date, -1)

				If @imported_due_date = @current_scheduled_due_date And @previous_working_date = @current_due_date CONTINUE


				if @task_status = 7
					BEGIN
						Update tblTask Set DueDate = @previous_working_date, 
						ScheduledDueDate = @imported_due_date, 
						StatusID = 1,
						UpdateUserID = @userEmployeeNumber
						WHERE ID = @task_id
					END
				ELSE
					BEGIN
						Update tblTask Set DueDate = @previous_working_date, 
						ScheduledDueDate = @imported_due_date,
						UpdateUserID = @userEmployeeNumber
						WHERE ID = @task_id
					END
				FETCH NEXT FROM db_cursor INTO @task_name, @imported_due_date, @current_due_date, @current_scheduled_due_date, @task_status, @task_id;

			END
	CLOSE db_cursor;
	DEALLOCATE db_cursor;