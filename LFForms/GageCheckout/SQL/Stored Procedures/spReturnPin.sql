USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spReturnPin] Script Date: 2/5/2025 7:50:24 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spReturnPin];


GO




CREATE PROCEDURE [dbo].[spReturnPin]  
	@ticket_id							INT,
	@pin_diameter						DECIMAL(6,4),
	@pin_type_id						INT,
	@bin_id									INT,
	@number_to_return				INT,
	@operator_employee_id		VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	DECLARE @count_of_active_pins as INT

	if @pin_type_id = 5
		BEGIN
					UPDATE	tblPinCheckoutDetail
					SET			GageStatusID			= 3,
									UpdatedTimestamp	= CURRENT_TIMESTAMP,
									UpdateUserID			= @operator_employee_id
					WHERE		TicketID					= @ticket_id
					AND			BinID							= @bin_id
					AND			GageStatusID			= 1
		END
	ELSE

		BEGIN
		
		IF @number_to_return = 1

		BEGIN
		
			UPDATE tblPinCheckoutDetail
			SET		GageStatusID				= 3,
						UpdatedTimestamp		= CURRENT_TIMESTAMP,
						UpdateUserID				= @operator_employee_id
			WHERE	TicketID						= @ticket_id
			AND		PinDiameter					= @pin_diameter
			AND		GageStatusID				<> 3
			AND		PinTypeID						= @pin_type_id
			AND		ID									= (	SELECT MIN(ID) from tblPinCheckoutDetail
																		WHERE	TicketID			= @ticket_id
																		AND		PinDiameter		= @pin_diameter
																		AND		PinTypeID			= @pin_type_id
																		AND		GageStatusID	= 1 )
		END
	ELSE IF @number_to_return > 1
		BEGIN

			UPDATE	tblPinCheckoutDetail
			SET		GageStatusID			= 3,
						UpdatedTimestamp	= CURRENT_TIMESTAMP,
						UpdateUserID			= @operator_employee_id
			WHERE	TicketID					= @ticket_id
			AND		PinDiameter				= @pin_diameter
			AND		GageStatusID			= 1
			AND		PinTypeID					= @pin_type_id

		END
		
		END


	SET	@count_of_active_pins = (	SELECT COUNT(ID) 
											FROM tblPinCheckoutDetail
											WHERE	TicketID			= @ticket_id 
											AND	GageStatusID		= 1)

	IF @count_of_active_pins = 0
		BEGIN
			UPDATE tblTicket
			SET	TicketStatusID		= 2, 
			UpdatedTimestamp			= CURRENT_TIMESTAMP,
			UpdateUserID					= @operator_employee_id
			WHERE ID							= @ticket_id			
		END

END
