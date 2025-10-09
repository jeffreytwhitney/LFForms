USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_AddNew]    Script Date: 10/9/2025 5:17:43 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO





CREATE OR ALTER   PROCEDURE [spPURCHASEORDER_AddNew]
		@SiteID							 INT,
    @PurchaseOrderTypeID INT,
    @Vendor              VARCHAR(255),
    @GageIDSN            VARCHAR(500),
    @Description         VARCHAR(1000) = NULL,
    @Quantity            INT = NULL,
    @RequestorID         INT,
    @UpdateUserID        VARCHAR(10) = NULL,
		@TotalCost					 FLOAT,
    @NewID               INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
		IF @PurchaseOrderTypeID = 1
			BEGIN
				INSERT INTO [dbo].[tblPurchaseOrder] (SiteID, PurchaseOrderStatusID, [PurchaseOrderTypeID], [Vendor], [GageIDSN], [Description], [Quantity], RequestorID, [UpdateUserID], TotalCost				)
				VALUES (@SiteID, 1, @PurchaseOrderTypeID, @Vendor, @GageIDSN, @Description, @Quantity, @RequestorID, @UpdateUserID, @TotalCost);
			END
		ELSE
			BEGIN
				INSERT INTO [dbo].[tblPurchaseOrder] (SiteID, PurchaseOrderStatusID, [PurchaseOrderTypeID], [Vendor], [GageIDSN], [Description], RequestorID, [UpdateUserID], TotalCost)
				VALUES (@SiteID, 1, @PurchaseOrderTypeID, @Vendor, @GageIDSN, @Description, @RequestorID, @UpdateUserID, @TotalCost);
			END

      SET @NewID = CAST(SCOPE_IDENTITY() AS INT);
      SELECT @NewID AS [ID];

END


GO


