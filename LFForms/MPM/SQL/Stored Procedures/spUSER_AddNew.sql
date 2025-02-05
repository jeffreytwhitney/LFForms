CREATE PROCEDURE [dbo].spUSER_AddNew
	@site_id INT,
	@is_active SMALLINT,
	@first_name NVARCHAR(255),
	@last_name NVARCHAR(255),
	@employee_number NVARCHAR(10),
	@email NVARCHAR(255),
	@network_username NVARCHAR(255),
	@is_admin SMALLINT,
	@update_user_employee_number varchar(10)
AS
	BEGIN
		SET NOCOUNT ON;
		DECLARE @error_message nvarchar(max) = ''
	
		if @site_id is null or @site_id not in (select ID from tblSite)
			begin
				SET @error_message = @error_message + 'Site ID is required.\r\n'
			end

		SET @is_active = ISNULL(@is_active, 0)
		IF @is_active not in (0, 1)
			begin
				SET @error_message = @error_message + 'Invalid IsActive value.\r\n'
			end

		IF @first_name is null or @first_name = ''
			begin
				SET @error_message = @error_message + 'First Name is required.\r\n'
			end

		IF @last_name is null or @last_name = ''
			begin
				SET @error_message = @error_message + 'Last Name is required.\r\n'
			end

		IF @employee_number is null or @employee_number = ''
			begin
				SET @error_message = @error_message + 'Employee Number is required.\r\n'
			end
		
		if dbo.fnIsEmailValid(@email) = 0
			begin
				SET @error_message = @error_message + 'Invalid Email Address.\r\n'
			end

		IF @network_username is null or @network_username = ''
			begin
				SET @error_message = @error_message + 'Network Username is required.\r\n'
			end

		SET @is_admin = ISNULL(@is_admin, 0)
		IF @is_admin not in (0, 1)
			begin
				SET @error_message = @error_message + 'Invalid IsAdmin value.\r\n'
			end

		if @error_message <> ''
			begin
				RAISERROR(@error_message, 16, 1)
				RETURN 0
			end

		INSERT INTO [dbo].[tblUser]
           ([SiteID]
           ,[IsActive]
           ,[FName]
           ,[LName]
           ,[EmployeeNumber]
           ,[EMailAddress]
           ,[NetworkUserName]
           ,[IsAdmin]
           ,[UpdateUserID])
     VALUES
           (@site_id,
						@is_active,
						@first_name,
						@last_name,
						@employee_number,
						@email,
						@network_username,
						@is_admin,
						@update_user_employee_number)

		SELECT SCOPE_IDENTITY()
	END