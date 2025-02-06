USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spReturnThreadGage] Script Date: 2/5/2025 8:27:36 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spReturnThreadGage];


GO




CREATE   PROCEDURE [dbo].[spReturnThreadGage]  
	@ticket_id								INT,
	@thread_gage_id						INT,
	@operator_employee_id			VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;
	DECLARE @count_of_active_threadgages as INT


	UPDATE	tblThreadCheckoutDetail
	SET		GageStatusID		= 3,
			UpdatedTimestamp	= CURRENT_TIMESTAMP,
			UpdateUserID			= @operator_employee_id
	WHERE	TicketID				= @ticket_id
	AND		ThreadGageID		= @thread_gage_id
	AND		GageStatusID		<> 3
	
		

	SET	@count_of_active_threadgages = (	SELECT COUNT(ID) 
											FROM tblThreadCheckoutDetail
											WHERE	TicketID		= @ticket_id 
											AND		GageStatusID	= 1)

	IF @count_of_active_threadgages = 0
		BEGIN
			UPDATE tblTicket
			SET	TicketStatusID		= 2, 
			UpdatedTimestamp		= CURRENT_TIMESTAMP,
			UpdateUserID			= @operator_employee_id
			WHERE ID				= @ticket_id			
		END

END
