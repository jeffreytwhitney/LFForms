USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_Update]    Script Date: 10/7/2025 9:21:39 AM ******/
DROP PROCEDURE [spPURCHASEORDER_Update]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_Update]    Script Date: 10/7/2025 9:21:39 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE   PROCEDURE [spPURCHASEORDER_Update]
    @ID										INT,
		@PurchaseOrderNumber	VARCHAR(50) = NULL,
		@StatusID							INT,
    @GageIDSN             VARCHAR(500),
    @Description          VARCHAR(1000) = NULL,
    @Quantity             INT = NULL,
		@TotalCost						FLOAT,
    @RequestorID          INT,
    @UpdateUserID					VARCHAR(10) = NULL
		
AS
BEGIN
    SET NOCOUNT ON;

		UPDATE	tblPurchaseOrder 
		SET			PurchaseOrderNumber = @PurchaseOrderNumber,
						PurchaseOrderStatusID = @StatusID,
						GageIDSN = @GageIDSN,
						Description = @Description,
						Quantity = @Quantity,
						TotalCost	= @TotalCost,
						RequestorID = @RequestorID,
						UpdateUserID = @UpdateUserID
		WHERE		ID = @ID

END

GO


