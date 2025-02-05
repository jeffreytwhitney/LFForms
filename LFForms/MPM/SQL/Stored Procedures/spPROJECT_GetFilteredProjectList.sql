

CREATE PROCEDURE [dbo].[spPROJECT_GetFilteredProjectList]
	@site_id smallint = 0,
	@include_completed smallint = 0,
	@filter_project_id int = 0,
	@department_id int = 0,
	@qe_id int = 0,
	@initiator_employee_number varchar(255) = '',
	@filter_project_name varchar(255) = '',
	@filter_task_name varchar(255) = '',
	@page_number int = 1
	
AS
	BEGIN
		SET NOCOUNT ON;
		Declare @skip_rows int = (@page_number - 1) * 25;
		DECLARE @sql varchar(max) = '';

		IF @include_completed = 1
			SET @sql = 'SELECT * FROM qryProjectList WHERE SiteID = ' + cast(@site_id as varchar);
		ELSE
			BEGIN
				SET @sql = 'SELECT * FROM qryProjectList WHERE CountOfActiveTasks > 0 and SiteID = ' + cast(@site_id as varchar);
			END
    

		if @filter_project_name <> ''
			BEGIN
				SET @sql = @sql + ' AND ProjectName LIKE ''%' + @filter_project_name + '%''';
			END


		if @initiator_employee_number <> ''
			BEGIN
				SET @sql = @sql + ' AND InitiatorEmployeeNumber = ''' + @filter_project_name + '';
			END


		if @filter_project_id in (select ID from tblProject)
			BEGIN
					SET @sql = @sql + ' AND ProjectID = ' + cast(@filter_project_id as varchar);
			END


    IF @filter_task_name IS NOT NULL AND @filter_task_name <> ''
			BEGIN
				SET @filter_task_name = dbo.fnSanitizeText(@filter_task_name);
				DECLARE @filter_string varchar(max) = (Select STRING_AGG(ProjectID, ', ') FROM tblTask WHERE TaskName LIKE '%' + @filter_task_name + '%')
  			SET @sql = @sql + ' AND ID IN (' +  @filter_string + ')'
			END
		
		if @department_id in (select ID from tblDepartment where SiteID = @site_id)
			BEGIN
					SET @sql = @sql + ' AND DepartmentID = ' + cast(@department_id as varchar);
			END

		if @qe_id in (select ID from qryQualityEngineers where SiteID = @site_id)
			BEGIN
					SET @sql = @sql + ' AND SecondaryProjectOwnerID = ' + cast(@qe_id as varchar);
			END
		

		SET @sql = @sql + ' ORDER BY ProjectName';
		
		IF @page_number <> 0
			BEGIN
				SET @sql = @sql + ' OFFSET ' + cast(@skip_rows as varchar) + ' ROWS FETCH NEXT 25 ROWS ONLY';
			END
		
		PRINT @sql
		Exec(@sql);


	END