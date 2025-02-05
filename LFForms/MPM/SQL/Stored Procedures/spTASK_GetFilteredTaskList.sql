

CREATE PROCEDURE [dbo].[spTASK_GetFilteredTaskList]
	@site_id smallint = 0,
	@task_name varchar(255) = '',
	@project_name varchar(255) = '',
	@include_completed smallint = 0,
	@include_not_scheduled smallint = 0 ,
	@exclude_waiting_on_part smallint = 0,
	@assignee_id int = 0,
	@tasktype_id int = 0,
	@status_id int = 0,
	@department_id int = 0,
	@project_id int = 0,
	@initiator_id int = 0,
	@qe_id int = 0,
	@page_number int = 1

AS
	BEGIN
		SET NOCOUNT ON;

		Declare @skip_rows int = (@page_number - 1) * 25;
		DECLARE @sql varchar(max) = '';

		set @sql = 'SELECT * from qryTaskList WHERE SiteID = ' + cast(@site_id as varchar);

		if @task_name <> ''
			BEGIN
				SET @sql = @sql + ' AND TaskName LIKE ''%' + @task_name + '%''';
			END

		if @project_name <> ''
			BEGIN
				SET @sql = @sql + ' AND ProjectName LIKE ''%' + @project_name + '%''';
			END

		If @include_completed is null or @include_completed = 0
			BEGIN
				SET @sql = @sql + ' AND IsCompleteOrCancelled = 0';
			END					

		If @include_not_scheduled is null or @include_not_scheduled = 0
			BEGIN
					SET @sql = @sql + ' AND StatusID <> 7';
			END

		If @exclude_waiting_on_part = 1
			BEGIN
				SET @sql = @sql + ' AND StatusID <> 3';
			END
		
		if @assignee_id in (select ID from tblUser where IsActive = 1 and SiteID = @site_id)
			BEGIN
					SET @sql = @sql + ' AND AssignedToID = ' + cast(@assignee_id as varchar);
			END

		if @tasktype_id in (select ID from tblTaskType)
			BEGIN
					SET @sql = @sql + ' AND TaskTypeID = ' + cast(@tasktype_id as varchar);
			END

		if @department_id in (select ID from tblDepartment where SiteID = @site_id)
			BEGIN
					SET @sql = @sql + ' AND DepartmentID = ' + cast(@department_id as varchar);
			END

		if @status_id in (select ID from tblStatus)
			BEGIN
					SET @sql = @sql + ' AND StatusID = ' + cast(@status_id as varchar);
			END

		if @project_id in (select ID from tblProject)
			BEGIN
					SET @sql = @sql + ' AND ProjectID = ' + cast(@project_id as varchar);
			END

		if @initiator_id in (select ID from tblUser)
			BEGIN
					SET @sql = @sql + ' AND InitiatorEmployeeID = ' + cast(@initiator_id as varchar);
			END

		if @qe_id in (select ID from tblUser where UserTypeID = 3)
			BEGIN
					SET @sql = @sql + ' AND SecondaryProjectOwnerID = ' + cast(@qe_id as varchar);
			END
		
		Set @sql = @sql + ' ORDER BY DueDate, ScheduledDueDate, TaskName OFFSET ' + cast(@skip_rows as varchar) + ' ROWS FETCH NEXT 25 ROWS ONLY';

		print @sql
		Exec(@sql);


	END