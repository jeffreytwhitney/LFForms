


CREATE PROCEDURE [dbo].[spEMAIL_GetEmailMessageByTaskIDAndEMailType]
	@task_id						int,
	@email_event_type		varchar(255),
	@user_message_text	varchar(2000) = '',
	@include_notes			smallint = 0,
	@user_id						VARCHAR(10),
	@email_message			VARCHAR(MAX) OUTPUT
	
AS
	
	BEGIN
		SET NOCOUNT ON;
		SET @user_message_text = dbo.fnHTMLizeText(@user_message_text)
		SET @email_message = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = @email_event_type)
		DECLARE @last_note Varchar(max) = ''
		
		if (@email_message IS Null) RETURN
		If (@task_id Is Null) OR (@task_id not in (select ID from tblTask)) RETURN
		If (@email_event_type Is Null) or (@email_event_type = '') RETURN
		If (@user_id Is Null) or (@user_id = '') RETURN


		DECLARE @task_name varchar(255) = dbo.fnTaskNameByTaskID(@task_id)
		DECLARE @project_name varchar(255) = dbo.fnGetProjectNameByTaskID(@task_id)
		DECLARE @project_id int = dbo.fnGetProjectIDByTaskID(@task_id)
		DECLARE @project_description varchar(max) = dbo.fnGetProjectDescriptionByTaskID(@task_id)
		DECLARE @user_name Varchar(512) = dbo.fnGetUserNameByEmployeeNumber(@user_id)
		DECLARE @department_name varchar(255) = dbo.fnGetDepartmentNameByTaskID(@task_id)
		DECLARE @status_name varchar(255) = dbo.fnGetStatusNameByTaskID(@task_id)
		DECLARE @task_type_name varchar(255) = dbo.fnGetTaskTypeNameByTaskID(@task_id)

		DECLARE @due_date varchar(10) = (SELECT CONVERT(varchar, DueDate, 101) from tblTask where ID = @task_id)
		DECLARE @scheduled_due_date varchar(10) = (SELECT CONVERT(varchar, ScheduledDueDate, 101) from tblTask where ID = @task_id)
		DECLARE @ticket_number varchar(255) = CAST(@project_id as varchar)
		DECLARE @total_hours real = (Select ISNULL(Sum(Hours),0) from tblTaskTimeEntry WHERE TaskID = @task_id)

		
		IF @include_notes <> 0
			set @last_note = (Select TaskNote from tblTaskNotes WHERE ID = (Select Max(ID) from tblTaskNotes where TaskID = @task_id))

		set @email_message = Replace(@email_message, '[Assigner]', @user_name)
		set @email_message = Replace(@email_message, '[Employee]', @user_name)
		set @email_message = Replace(@email_message, '[TaskUpdateRequest]', @user_message_text)
		set @email_message = Replace(@email_message, '[NoteText]', @user_message_text)
		set @email_message = Replace(@email_message, '[TaskName]', @task_name)
		set @email_message = Replace(@email_message, '[ProjectName]', @project_name)
		set @email_message = Replace(@email_message, '[Department]', @department_name)
		set @email_message = Replace(@email_message, '[Status]', @status_name)
		set @email_message = Replace(@email_message, '[TaskType]', @task_type_name)
		set @email_message = Replace(@email_message, '[TicketNumber]', @ticket_number)
		set @email_message = Replace(@email_message, '[DueDate]', @due_date)
		set @email_message = Replace(@email_message, '[ScheduledDueDate]', @scheduled_due_date)
		set @email_message = Replace(@email_message, '[TotalHours]', CAST(@total_hours as varchar))
		set @email_message = Replace(@email_message, '[ProjectDescription]', @project_description)
		IF @include_notes <> 0
			set @email_message = Replace(@email_message, '[Note]', @last_note)
			set @email_message = Replace(@email_message, '[CompletionNotes]', @last_note)

		Select @email_message
		RETURN
	END