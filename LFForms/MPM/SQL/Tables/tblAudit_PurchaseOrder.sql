USE [LF_RMS_COMMS_MPM]
GO

ALTER TABLE [tblAudit_PurchaseOrder] DROP CONSTRAINT [DF_tblAudit_PurchaseOrder_CreatedTimeStamp]
GO

/****** Object:  Table [tblAudit_PurchaseOrder]    Script Date: 10/7/2025 5:47:26 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblAudit_PurchaseOrder]') AND type in (N'U'))
DROP TABLE [tblAudit_PurchaseOrder]
GO

/****** Object:  Table [tblAudit_PurchaseOrder]    Script Date: 10/7/2025 5:47:26 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [tblAudit_PurchaseOrder](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[PurchaseOrderID] [int] NOT NULL,
	[FieldName] [varchar](150) NOT NULL,
	[ValueFrom] [varchar](255) NULL,
	[ValueTo] [varchar](255) NULL,
	[UpdatedBy] [varchar](10) NULL,
	[CreatedTimeStamp] [datetime] NOT NULL
) ON [PRIMARY]
GO

ALTER TABLE [tblAudit_PurchaseOrder] ADD  CONSTRAINT [DF_tblAudit_PurchaseOrder_CreatedTimeStamp]  DEFAULT (getdate()) FOR [CreatedTimeStamp]
GO


