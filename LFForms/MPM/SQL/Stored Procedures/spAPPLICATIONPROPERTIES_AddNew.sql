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
	@propertyName varchar(255),
	@propertyValue varchar(255),
	@notes varchar(1000)
AS
	BEGIN
		SET NOCOUNT ON;
		
		INSERT INTO [tblApplicationProperties]
           ([PropertyName]
           ,[PropertyValue]
           ,[Notes])
     VALUES
           (@propertyName
           ,@propertyValue
           ,@notes)


	END
GO

