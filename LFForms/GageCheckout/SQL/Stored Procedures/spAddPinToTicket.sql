USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spAddPinToTicket] Script Date: 2/5/2025 7:47:21 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spAddPinToTicket];


GO



CREATE PROCEDURE [dbo].[spAddPinToTicket] 
	@ticket_id						INT,
	@pin_diameter					DECIMAL(6,4),
	@pin_type_id					INT,
	@bin_id								INT,
	@number_of_pins					INT,
	@operator_employee_id			VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;

	if (@bin_id = 0) SET @bin_id = NULL

	DECLARE @Counter INT 
	SET @Counter = @number_of_pins
	WHILE ( @Counter > 0)
	BEGIN
		INSERT INTO [dbo].[tblPinCheckoutDetail]
           ([TicketID]
           ,[GageStatusID]
           ,[PinDiameter]
           ,[PinTypeID]
					 ,BinID
           ,[UpdateUserID])
		VALUES
           (@ticket_id
           ,1
           ,@pin_diameter
           ,@pin_type_id
					 ,@bin_id
           ,@operator_employee_id)
		SET @Counter  = @Counter - 1
	END
END
