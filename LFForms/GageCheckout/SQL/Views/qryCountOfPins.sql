USE [GageCheckout]
GO

/****** Object: View [dbo].[qryCountOfPins] Script Date: 2/5/2025 1:00:16 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP VIEW [dbo].[qryCountOfPins];


GO
CREATE VIEW dbo.qryCountOfPins
AS
SELECT DISTINCT 
                         dbo.tblPinCheckoutDetail.TicketID, 
												 dbo.tblPinCheckoutDetail.PinDiameter, 
												 dbo.tlkpPinType.PinType, COUNT(dbo.tblPinCheckoutDetail.ID) AS NumberOfPins, 
												 dbo.tlkpPinType.ID AS PinTypeID, 
												 dbo.tblPinCheckoutDetail.BinID, 
                         dbo.tlkpBins.BinName
FROM            dbo.tblPinCheckoutDetail LEFT OUTER JOIN
                         dbo.tlkpBins ON dbo.tblPinCheckoutDetail.BinID = dbo.tlkpBins.ID LEFT OUTER JOIN
                         dbo.tlkpPinType ON dbo.tblPinCheckoutDetail.PinTypeID = dbo.tlkpPinType.ID
												 WHERE tblPinCheckoutDetail.GageStatusID = 1
GROUP BY dbo.tblPinCheckoutDetail.TicketID, 
dbo.tblPinCheckoutDetail.PinDiameter, 
dbo.tlkpPinType.PinType, 
dbo.tblPinCheckoutDetail.GageStatusID, 
dbo.tlkpPinType.ID, 
dbo.tblPinCheckoutDetail.BinID, 
dbo.tlkpBins.BinName

