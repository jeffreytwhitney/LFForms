USE [LF_RMS_COMMS_MPM]
GO
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE PROCEDURE [spEMAIL_GetAutoPesterAssigneeEMailMessage]
	@assignee_id						int,
	@email_message			VARCHAR(MAX) OUTPUT
AS
	
	BEGIN
		SET NOCOUNT ON;
		DECLARE @error_message nvarchar(max) = ''
		
		
		DECLARE @email_message_template varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = 'AUTO_PESTER_ASSIGNEE_MESSAGE');
		if (len(trim(@email_message_template)) = 0) 
			begin
				SET @error_message = @error_message + 'EMail Message Template is Empty.\r\n\'
			end

		DECLARE @email_row_template varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = 'AUTO_PESTER_ASSIGNEE_ROW');
		if (len(trim(@email_message_template)) = 0) 
			begin
				SET @error_message = @error_message + 'EMail Row Template is Empty.\r\n\'
			end

		DECLARE @ticket_url_template varchar(255) = (Select IsNull(PropertyValue, '') from tblApplicationProperties WHERE PropertyName = 'TicketHTMLAddress')
			if (len(trim(@ticket_url_template)) = 0) 
			begin
				SET @error_message = @error_message + 'Ticket URL Template is Empty.\r\n\'
			end

		DECLARE @task_url_template varchar(255) = (Select IsNull(PropertyValue, '') from tblApplicationProperties WHERE PropertyName = 'TaskHTMLAddress')
			if (len(trim(@task_url_template)) = 0) 
			begin
				SET @error_message = @error_message + 'Task URL Template is Empty.\r\n\'
			end

		DECLARE @task_count int = (Select Count(ID) from qryAutoPesterAssigneeTasks WHERE AssignedToID = @assignee_id);
		if @task_count = 0
			BEGIN
				SET @error_message = @error_message + 'Nothing To Process for Assignee ID ' + CAST(@assignee_id as varchar) + '.\r\n\'
			END
		
		if @error_message <> ''
			begin
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			end		
		
		SET @email_message = @email_message_template
		DECLARE @email_rows varchar(max) = '';
		DECLARE @email_row varchar(max);

		DECLARE @task_id INT
		DECLARE @ticket_id INT
		DECLARE @ticket_number varchar(255);
		DECLARE @task_name varchar(255);
		DECLARE @due_date varchar(12);
		DECLARE @days_past_due varchar(10);
		DECLARE @task_type varchar(255);
		DECLARE @assignee_name Varchar(255)
		DECLARE @ticket_url varchar(500);
		DECLARE @task_url varchar(500);
		DECLARE @qe_name Varchar(500);
		DECLARE @status varchar(255);
		
		SET @email_message = Replace(@email_message_template, '[CountOfTasks]', CAST(@task_count as varchar))

		DECLARE db_cursor CURSOR FOR select ID, ProjectID, TicketNumber, TaskName, CONVERT(varchar, DueDate, 101), Cast(DaysPastDue as varchar), TaskType, AssigneeName, Status, QEName from qryAutoPesterAssigneeTasks WHERE AssignedToID = @assignee_id;
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO @task_id, @ticket_id, @ticket_number, @task_name, @due_date, @days_past_due, @task_type, @assignee_name;
			WHILE @@FETCH_STATUS = 0  
				BEGIN  
					Print 'Task ID:' + Cast(@task_id as varchar)

					set @email_row = @email_row_template

					
					

					SET @ticket_url = Replace(@ticket_url_template, '[TicketID]', Cast(@ticket_id as varchar))
					SET @task_url = Replace(@task_url_template, '[TaskID]', Cast(@task_id as varchar))

					SET @email_row = Replace(@email_row, '[TicketURL]', @ticket_url)
					SET @email_row = Replace(@email_row, '[TicketNumber]', @ticket_number)
					SET @email_row = Replace(@email_row, '[TaskURL]', @task_url)
					SET @email_row = Replace(@email_row, '[TaskName]', @task_name)
					SET @email_row = Replace(@email_row, '[TaskType]', @task_type)
					SET @email_row = Replace(@email_row, '[Status]', @status)
					SET @email_row = Replace(@email_row, '[AssigneeName]', @assignee_name)
					SET @email_row = Replace(@email_row, '[DueDate]', @due_date)
					SET @email_row = Replace(@email_row, '[DaysPastDue]', @days_past_due)
					SET @email_row = Replace(@email_row, '[QEName]', @qe_name)
					
					SET @email_rows = @email_rows + @email_row

						 
					FETCH NEXT FROM db_cursor INTO @task_id, @ticket_id, @ticket_number, @task_name, @due_date, @days_past_due, @task_type, @assignee_name;
				END

		CLOSE db_cursor;
		DEALLOCATE db_cursor;
		
		SET @email_message = Replace(@email_message, '[TaskRows]', @email_rows)

		Select @email_message
		RETURN

	END
GO


