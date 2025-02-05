

CREATE PROCEDURE [dbo].[spEMAIL_GetTasksDueTodayEmailMessage]

AS
	
	BEGIN
		SET NOCOUNT ON;
		
		DECLARE @email_message varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = 'CURRENT_TASKS_NOTIFICATION');
		DECLARE @email_message_row_template varchar(max) = '<tr><td>[TicketNumber]</td><td>[ProjectName]</td><td>[TaskName]</td><td>[Status]</td><td>[TaskType]</td><td>[Department]</td><td>[Assignee]</td></tr>';
		if (len(trim(@email_message)) = 0) RETURN;

		DECLARE @email_task_row varchar(max);
		DECLARE @email_task_rows varchar(max) = '';
		DECLARE @task_name varchar(255);
		DECLARE @project_ID int;
		DECLARE @project_name varchar(255) 
		DECLARE @task_status varchar(255);
		DECLARE @task_type varchar(255);
		DECLARE @department_name varchar(255);
		DECLARE @assignee_name Varchar(512)
		
		DECLARE db_cursor CURSOR FOR SELECT qryActiveTasksByPriority.ProjectID, qryActiveTasksByPriority.ProjectName, qryActiveTasksByPriority.TaskName, 
																		qryActiveTasksByPriority.TaskType, qryActiveTasksByPriority.Status, 
																		IsNull(qryActiveTasksByPriority.Assignee, ''), qryActiveTasksByPriority.DepartmentName 
																	FROM qryActiveTasksByPriority INNER JOIN tblImportCurrentlyRunningTasks 
																	ON qryActiveTasksByPriority.TaskID = tblImportCurrentlyRunningTasks.TaskID 
																	WHERE qryActiveTasksByPriority.ManualDueDate=0;
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO @project_ID, @project_name, @task_name, @task_type, @task_status, @assignee_name, @department_name;
			WHILE @@FETCH_STATUS = 0  
				BEGIN  
					SET @email_task_row = @email_message_row_template;
					SET @email_task_row = Replace(@email_task_row, '[TicketNumber]', Cast(@project_ID as varchar));
					SET @email_task_row = Replace(@email_task_row, '[TaskName]', @task_name);
					SET @email_task_row = Replace(@email_task_row, '[ProjectName]', @project_name);
					SET @email_task_row = Replace(@email_task_row, '[Status]', @task_status);
					SET @email_task_row = Replace(@email_task_row, '[TaskType]', @task_type);
					SET @email_task_row = Replace(@email_task_row, '[Department]', @department_name);
					SET @email_task_row = Replace(@email_task_row, '[Assignee]', @assignee_name);
					SET @email_task_rows = CONCAT(@email_task_rows, @email_task_row);

					FETCH NEXT FROM db_cursor INTO @project_ID, @project_name, @task_name, @task_type, @task_status, @assignee_name, @department_name;
				END;

			CLOSE db_cursor;
			DEALLOCATE db_cursor;
		
		Set @email_message = Replace(@email_message, '[CurrentTaskRows]', @email_task_rows);
		

		Select @email_message

	END