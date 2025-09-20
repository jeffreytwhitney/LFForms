USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spAPPLICATIONPROPERTIES_Update]    Script Date: 9/12/2025 9:24:18 AM ******/
DROP PROCEDURE [spAPPLICATIONPROPERTIES_Update]
GO

/****** Object:  StoredProcedure [spAPPLICATIONPROPERTIES_Update]    Script Date: 9/12/2025 9:24:18 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [spAPPLICATIONPROPERTIES_Update]
	@propertyName varchar(255),
	@propertyValue varchar(255),
	@notes varchar(1000)
AS
	BEGIN
	/*
	Procedure: [spAPPLICATIONPROPERTIES_Update]
	Purpose:
	  - Updates the value and notes of an existing application property in [tblApplicationProperties].

	Parameters:
	  @propertyName varchar(255)
		- The unique key/name of the property to update. Must correspond to an existing row in [tblApplicationProperties].[PropertyName].
	  @propertyValue varchar(255)
		- The new value to set for the property.
	  @notes varchar(1000)
		- Optional descriptive notes or context for the property value.

	Behavior:
	  - Performs an UPDATE on [tblApplicationProperties] for the row matching [PropertyName] = @propertyName.
	  - Does not insert a new row if no match is found (i.e., if the property does not exist, no rows are affected).
	  - SET NOCOUNT ON is used to suppress row count messages.

	Returns:
	  - No explicit result set. Clients may inspect @@ROWCOUNT after execution to determine the number of rows affected.

	Permissions:
	  - Requires UPDATE permissions on [tblApplicationProperties].

	Usage:
	  EXEC [spAPPLICATIONPROPERTIES_Update]
		   @propertyName = 'SomeSetting',
		   @propertyValue = 'NewValue',
		   @notes = 'Updated during deployment 2025-09-19';

	Change Log:
	  - 2025-09-19: Added documentation header and inline comments. No functional changes.
	*/
		SET NOCOUNT ON;
		
			UPDATE [tblApplicationProperties]
				 SET [PropertyValue] = @propertyValue
						,[Notes] = @notes
			 WHERE [PropertyName] = @propertyName


	END
GO

