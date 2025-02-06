USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spAddThreadGageToTicket] Script Date: 2/5/2025 8:22:34 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spAddThreadGageToTicket];


GO





CREATE PROCEDURE [dbo].[spAddThreadGageToTicket] 
	@ticket_id								INT,
	@thread_gage_id						INT,
	@operator_employee_id			VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;

	
	/* If this thread gage is out there somewhere marked as 'Missing' on another ticket, set it to 'Returned' because we obviously found it.*/
	UPDATE tblThreadCheckoutDetail
	SET GageStatusID	= 3,
	UpdatedTimestamp	= CURRENT_TIMESTAMP, 
	UpdateUserID			= @operator_employee_id
	WHERE				GageStatusID = 2
	AND					ThreadGageID = @thread_gage_id


	INSERT INTO [dbo].[tblThreadCheckoutDetail]
        ([TicketID]
        ,[GageStatusID]
        ,ThreadGageID
        ,[UpdateUserID])
	VALUES
        (@ticket_id
        ,1
        ,@thread_gage_id
        ,@operator_employee_id)
END
