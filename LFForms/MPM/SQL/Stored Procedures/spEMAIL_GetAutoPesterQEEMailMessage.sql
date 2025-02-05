
CREATE PROCEDURE [dbo].[spEMAIL_GetAutoPesterQEEMailMessage]

AS
	
	BEGIN
		SET NOCOUNT ON;
		
		DECLARE @email_message_template varchar(max) = (Select IsNull(EMailMessageTemplate, '') from tblEMailMessageTemplate WHERE EventName = 'AUTO_PESTER_MESSAGE');
		if (len(trim(@email_message_template)) = 0) RETURN;
		
		DECLARE @auto_pester_days INT = (Select Cast(PropertyValue as INT) from tblApplicationProperties WHERE PropertyName = 'AutoPesterQEDays') 
		DECLARE @pester_task_ids TABLE (task_id INT);
		DECLARE @output_email_messages TABLE (TaskName varchar(255), QEEmailAddress varchar(255),EmailMessage varchar(max));

		DECLARE @email_message varchar(max)
		DECLARE @due_date varchar(10)
		DECLARE @task_name varchar(255)
		DECLARE @user_fname Varchar(255)
		DECLARE @user_lname Varchar(255)
		DECLARE @waiting_note Varchar(max)
		DECLARE @qe_email_address varchar(255)
		DECLARE @task_id INT

		
		INSERT INTO @pester_task_ids 
			SELECT tblTask.ID 
			FROM tblTask 
			WHERE tblTask.StatusID=3 AND tblTask.DueDate<DateAdd(dd,-@auto_pester_days,GETDATE());
		
		
		
		DECLARE db_cursor CURSOR FOR select task_id from @pester_task_ids;
		OPEN db_cursor;
		
		FETCH NEXT FROM db_cursor INTO @task_id;
			WHILE @@FETCH_STATUS = 0  
				BEGIN  
					SET @qe_email_address = dbo.fnGetQEEmailAddressByTaskID(@task_id);

					if LEN(TRIM(@qe_email_address)) > 0
						BEGIN
							SET @email_message = @email_message_template;
							SET @due_date= (SELECT CONVERT(varchar, DueDate, 101) from tblTask where ID = @task_id);
							SET @task_name = dbo.fnTaskNameByTaskID(@task_id);
							SET @waiting_note = dbo.fnGetWaitReasonForTaskID(@task_id);
						
							SELECT @user_fname = FName, @user_lname = LName 
								FROM tblTask INNER JOIN tblUser ON tblTask.AssignedToID = tblUser.ID
								WHERE tblTask.ID=@task_id;
						
							SET @email_message = Replace(@email_message, '[DueDate]', @due_date)
							IF LEN(@waiting_note) = 0
								SET @email_message = Replace(@email_message, '[WaitingReason]', 'The programmer did not give a reason why they marked this as waiting. Contact them for the reason.');
							ELSE
								SET @email_message = Replace(@email_message, '[WaitingReason]', @waiting_note);
						
							SET @email_message = Replace(@email_message, '[AutoPesterQEDays]', Cast(@auto_pester_days as varchar))
							SET @email_message = Replace(@email_message, '[AssigneeFName]', @user_fname)
							SET @email_message = Replace(@email_message, '[AssigneeLName]', @user_lname)
						
							INSERT INTO @output_email_messages (TaskName, QEEmailAddress, EmailMessage)
								VALUES (@task_name, @qe_email_address, @email_message)

						END
						 
					FETCH NEXT FROM db_cursor INTO @task_id;
				END;

			CLOSE db_cursor;
			DEALLOCATE db_cursor;
		
		Select * from @output_email_messages

	END