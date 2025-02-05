CREATE PROCEDURE [dbo].[spIMPORT_WriteTaskNameIfEarlier]
	@task_name Varchar(255),
	@due_date Date,
	@schedule_id int
	
AS
	SET NOCOUNT ON;
	DECLARE @should_ignore smallint = (Select Count(*) from qryIgnoreScheduleByTask WHERE TaskName = @task_name AND ScheduleIDToIgnore = @schedule_id)

	IF @should_ignore = 1 RETURN 0 
	
	DECLARE @db_due_date Date = (Select DueDate from tblImport where TaskName = @task_name)
	If @db_due_date IS NULL
		Begin
			INSERT INTO tblImport (TaskName, DueDate) VALUES (@task_name, @due_date)
		End
	Else
		Begin
			IF @due_date < @db_due_date
				BEGIN
					UPDATE tblImport SET DueDate = @due_date WHERE TaskName = @task_name
				END
		End



RETURN 0