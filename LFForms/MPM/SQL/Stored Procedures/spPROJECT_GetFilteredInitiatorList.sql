

CREATE PROCEDURE [dbo].[spPROJECT_GetFilteredInitiatorList]
	@site_id smallint = 0,
	@include_completed smallint = 0,
	@filter_project_id int = 0,
	@department_id int = 0,
	@qe_id int = 0,
	@filter_project_name varchar(255) = '',
	@filter_task_name varchar(255) = ''
	
AS
	BEGIN
		SET NOCOUNT ON;
		
		DECLARE @sql varchar(max) = '';

		IF @include_completed = 1
			SET @sql = 'SELECT DISTINCT InitiatorEmployeeNumber, InitiatorName FROM qryProjectList WHERE SiteID = ' + cast(@site_id as varchar);
		ELSE
			BEGIN
				SET @sql = 'SELECT DISTINCT InitiatorEmployeeNumber, InitiatorName, InitiatorLastName FROM qryProjectList WHERE CountOfActiveTasks > 0 and SiteID = ' + cast(@site_id as varchar);
			END
    

		if @filter_project_name <> ''
			BEGIN
				SET @sql = @sql + ' AND ProjectName LIKE ''%' + @filter_project_name + '%''';
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
		


		SET @sql = @sql + ' AND InitiatorEmployeeNumber IS NOT NULL ORDER BY InitiatorLastName, InitiatorName, InitiatorEmployeeNumber';
		

		
		PRINT @sql
		Exec(@sql);


	END