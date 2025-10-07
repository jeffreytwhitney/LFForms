USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_AddNew]    Script Date: 10/7/2025 9:21:33 AM ******/
DROP PROCEDURE [spPURCHASEORDER_AddNew]
GO

/****** Object:  StoredProcedure [spPURCHASEORDER_AddNew]    Script Date: 10/7/2025 9:21:33 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE   PROCEDURE [spPURCHASEORDER_AddNew]
		@SiteID							 INT,
    @PurchaseOrderNumber VARCHAR(50) = NULL,
    @PurchaseOrderTypeID NCHAR(10),
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

      INSERT INTO [dbo].[tblPurchaseOrder] (
					SiteID,
					PurchaseOrderNumber,
          PurchaseOrderStatusID,
          [PurchaseOrderTypeID],
          [Vendor],
          [GageIDSN],
          [Description],
          [Quantity],
          RequestorID,
          [UpdateUserID],
					TotalCost
      )
      VALUES (
					@SiteID,
					@PurchaseOrderNumber,
					1,
          @PurchaseOrderTypeID,
          @Vendor,
          @GageIDSN,
          @Description,
          @Quantity,
          @RequestorID,
          @UpdateUserID,
					@TotalCost
      );

      SET @NewID = CAST(SCOPE_IDENTITY() AS INT);
      SELECT @NewID AS [ID];

END


GO


