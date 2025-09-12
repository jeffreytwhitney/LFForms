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
		SET NOCOUNT ON;
		
			UPDATE [tblApplicationProperties]
				 SET [PropertyValue] = @propertyValue
						,[Notes] = @notes
			 WHERE [PropertyName] = @propertyName


	END
GO

