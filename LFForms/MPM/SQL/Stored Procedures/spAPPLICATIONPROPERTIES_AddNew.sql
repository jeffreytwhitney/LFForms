USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spAPPLICATIONPROPERTIES_AddNew]    Script Date: 9/12/2025 9:24:12 AM ******/
DROP PROCEDURE [spAPPLICATIONPROPERTIES_AddNew]
GO

/****** Object:  StoredProcedure [spAPPLICATIONPROPERTIES_AddNew]    Script Date: 9/12/2025 9:24:12 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [spAPPLICATIONPROPERTIES_AddNew]
	@propertyName varchar(255),   -- Property key/name
	@propertyValue varchar(255),  -- Property value
	@notes varchar(1000)      -- Optional notes
AS
BEGIN
	SET NOCOUNT ON;
	/*
	Procedure: [spAPPLICATIONPROPERTIES_AddNew]
	Purpose:
		- Inserts a new application property into [tblApplicationProperties].

	Parameters:
		@propertyName varchar(255)
		- Unique property key/name to insert into [PropertyName].
		@propertyValue varchar(255)
		- Initial value for the property.
		@notes varchar(1000)
		- Optional notes or description for the property.

	Behavior:
		- Performs an INSERT into [tblApplicationProperties] with the provided values.
		- Does not validate duplicates. If a unique/primary key exists on [PropertyName],
		duplicate names will raise an error. Callers should ensure uniqueness or handle errors.

	Returns:
		- No explicit result set. Use TRY/CATCH in client code if error handling is needed.

	Permissions:
		- Requires INSERT permission on [tblApplicationProperties].

	Usage:
		EXEC [spAPPLICATIONPROPERTIES_AddNew]
			@propertyName = 'SomeSetting',
			@propertyValue = 'InitialValue',
			@notes = 'Created during deployment 2025-09-19';

	Change Log:
		- 2025-09-19: Added documentation header and inline comments. No functional changes.
*/


	INSERT INTO [tblApplicationProperties] (
		[PropertyName],
		[PropertyValue],
		[Notes]
	)
	VALUES (
		@propertyName,
		@propertyValue,
		@notes
	);
END
GO

