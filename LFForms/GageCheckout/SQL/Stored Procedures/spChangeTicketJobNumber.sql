USE [GageCheckout]
GO

/****** Object: SqlProcedure [dbo].[spChangeTicketJobNumber] Script Date: 2/5/2025 9:16:47 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spChangeTicketJobNumber];


GO




CREATE PROCEDURE [dbo].[spChangeTicketJobNumber] 
	@ticket_id						INT,
	@job_number						VARCHAR(50),
	@operator_employee_id			VARCHAR(10)
AS
BEGIN

	SET NOCOUNT ON;

	UPDATE tblTicket
	SET JobLotNumber		= @job_number,
	UpdateUserID			= @operator_employee_id,
	UpdatedTimestamp		= CURRENT_TIMESTAMP
	WHERE	ID				= @ticket_id

END
