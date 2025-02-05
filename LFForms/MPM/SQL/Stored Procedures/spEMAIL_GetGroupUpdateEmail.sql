

CREATE PROCEDURE [dbo].[spEMAIL_GetGroupUpdateEmail]
	@project_id						INT,
	@task_count						INT,
	@task_id_list					varchar(max),
	@include_notes				smallint = 0,
	@email_header_name		varchar(255),
	@email_details_name		varchar(255),
	@user_id			INT
	
AS
	
	BEGIN
		SET NOCOUNT ON;
		DECLARE @email_message varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = @email_header_name);
		DECLARE @email_row_template varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = @email_details_name);

		if (len(trim(@email_message)) = 0 ) RETURN;
		if (len(trim(@email_row_template)) = 0 ) RETURN;
		if (len(trim(@task_id_list)) = 0) RETURN;
		if (@task_count IS NULL) OR (@task_count = 0) RETURN;
		If (@project_id Is Null) OR (@project_id not in (select ID from tblProject)) RETURN;
		IF (@user_id Is Null) or (@user_id not in (select ID from tblUser)) RETURN;

		DECLARE @project_name varchar(255) = (Select ProjectName from tblProject where ID = @project_id);
		DECLARE @project_description varchar(max) = (Select ProjectDescription from tblProject where ID = @project_id);
		DECLARE @user_name Varchar(512) = dbo.fnGetUserNameByID(@user_id);
		DECLARE @department_name varchar(255) = dbo.fnGetDepartmentNameByProjectID(@project_id);
		DECLARE @task_rows varchar(max) = '';
		DECLARE @task_row varchar(max);
		
		
		DECLARE @task_name varchar(255);
		DECLARE @task_status varchar(255);
		DECLARE @task_type varchar(255);
		DECLARE @due_date varchar(255);
		DECLARE @scheduled_due_date varchar(255);
		DECLARE @last_note Varchar(max) = '';
		DECLARE @task_id INT;


		set @email_message = Replace(@email_message, '[TicketNumber]', Cast(@project_id as varchar));
		set @email_message = Replace(@email_message, '[TaskCount]', Cast(@task_count as varchar));
		set @email_message = Replace(@email_message, '[Assigner]', @user_name);
		set @email_message = Replace(@email_message, '[Employee]', @user_name);
		set @email_message = Replace(@email_message, '[ProjectName]', @project_name);
		set @email_message = Replace(@email_message, '[Department]', @department_name);
		set @email_message = Replace(@email_message, '[ProjectDescription]', @project_description);


		DECLARE db_cursor CURSOR FOR SELECT ID, TaskName, TaskType, Status, CONVERT(varchar, DueDate, 101), CONVERT(varchar, ScheduledDueDate, 101)  
																	FROM qryTaskDetails where ID in (SELECT * FROM [dbo].[fnSplitIntegers](@task_id_list));
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO @task_id, @task_name, @task_type, @task_status, @due_date, @scheduled_due_date;
		
		IF @include_notes <> 0
			BEGIN
				set @last_note = (Select ISNULL(TaskNote, '') from tblTaskNotes WHERE ID = (Select Max(ID) from tblTaskNotes where TaskID = @task_id));
				SET @email_message = Replace(@email_message, '[NOTE]', @last_note);
			END

		WHILE @@FETCH_STATUS = 0  
				BEGIN  
					SET @task_row = @email_row_template;
					SET @task_row = Replace(@task_row, '[TaskName]', @task_name);
					SET @task_row = Replace(@task_row, '[Status]', @task_status);
					SET @task_row = Replace(@task_row, '[TaskType]', @task_type);
					SET @task_row = Replace(@task_row, '[DueDate]', @due_date);
					SET @task_row = Replace(@task_row, '[ScheduledDueDate]', @scheduled_due_date);
					SET @task_rows = CONCAT(@task_rows, @task_row)
					FETCH NEXT FROM db_cursor INTO @task_id, @task_name, @task_type, @task_status, @due_date, @scheduled_due_date;
				END;

		CLOSE db_cursor;
		DEALLOCATE db_cursor;

		set @email_message = Replace(@email_message, '[TaskRows]', @task_rows);
		Select @email_message
	END