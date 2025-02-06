USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spReturnTicket] Script Date: 2/5/2025 9:12:42 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spReturnTicket];


GO




CREATE PROCEDURE [dbo].[spReturnTicket]
	@ticket_id						INT,
	@user_employee_id				VARCHAR(10)
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @ticket_type_id INT
	
	SET @ticket_type_id = ( SELECT TicketTypeID FROM tblTicket
							WHERE ID = @ticket_id)



	IF @ticket_type_id = 1 
		BEGIN
			UPDATE	tblPinCheckoutDetail
			SET		GageStatusID			= 3,
					UpdateUserID			= @user_employee_id,
					UpdatedTimestamp		= CURRENT_TIMESTAMP
			WHERE	TicketID				= @ticket_id
			AND		GageStatusID			= 1
		END

	IF @ticket_type_id = 2 
		BEGIN
			UPDATE	tblThreadCheckoutDetail
			SET		GageStatusID			= 3,
					UpdateUserID			= @user_employee_id,
					UpdatedTimestamp		= CURRENT_TIMESTAMP
			WHERE	TicketID				= @ticket_id
			AND		GageStatusID			= 1
		END

	UPDATE	tblTicket
	SET		TicketStatusID			= 2,
	UpdatedTimestamp				= CURRENT_TIMESTAMP
	WHERE	ID						= @ticket_id
    
END
