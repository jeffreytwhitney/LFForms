CREATE PROCEDURE [dbo].spPROJECT_AddNew
	@site_id	INT,
  @project_name	Varchar(255),
  @project_description varchar(max),
  @department_id INT,
  @primary_project_owner_id INT,
  @secondary_project_owner_id INT,
  @tertiary_project_owner_id INT,
  @update_user_employee_id varchar(10)
AS
	BEGIN
		SET NOCOUNT ON;

		DECLARE @error_message nvarchar(max) = ''

		If @site_id IS NULL OR @site_id NOT IN (select ID from tblSite)
			BEGIN
				SET @error_message = @error_message + 'Invalid Site ID.\r\n'
			END
		
		if @project_name is null or @project_name = ''
			begin
				SET @error_message = @error_message + 'Project Name is required.\r\n'
			end

		If (@department_id Is Null) OR (@department_id not in (select ID from tblDepartment))
			begin
				SET @error_message = @error_message + 'Department ID value is invalid.\r\n\'
			end

		If (@primary_project_owner_id not in (select ID from tblProjectOwner WHERE ProjectOwnerTypeID = 1))
			begin
				SET @error_message = @error_message + 'Primary Project Owner value is invalid.\r\n\'
			end

		If (@secondary_project_owner_id not in (select ID from tblProjectOwner WHERE ProjectOwnerTypeID = 2))
			begin
				SET @error_message = @error_message + 'Secondary Project Owner value is invalid.\r\n\'
			end

		If (@tertiary_project_owner_id not in (select ID from tblProjectOwner WHERE ProjectOwnerTypeID = 3))
			begin
				SET @error_message = @error_message + 'Tertiary Project Owner value is invalid.\r\n\'
			end

		If (@department_id Is Null) OR (@department_id not in (select ID from tblDepartment))
			begin
				SET @error_message = @error_message + 'Department ID value is invalid.\r\n\'
			end
	
		if @update_user_employee_id is null or @update_user_employee_id not in (select EmployeeNumber from tblUser WHERE IsActive = 1)
			begin
				SET @error_message = @error_message + 'Invalid UserUpdateID.\r\n'
			end

		if @error_message <> ''
			begin
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			end

		insert into tblProject (SiteID, ProjectName, ProjectDescription, DepartmentID, PrimaryProjectOwnerID, SecondaryProjectOwnerID, TertiaryProjectOwnerID, UpdateUserID)
		values (@site_id, @project_name, @project_description, @department_id, @primary_project_owner_id, @secondary_project_owner_id, @tertiary_project_owner_id, @update_user_employee_id)

		SELECT SCOPE_IDENTITY()

	END