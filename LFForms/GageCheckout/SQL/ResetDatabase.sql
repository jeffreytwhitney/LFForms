USE [GageCheckout]
GO
/****** Object:  Trigger [tblTicket_AfterUpdate]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblTicket_AfterUpdate]
GO
/****** Object:  Trigger [tblTicket_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblTicket_AfterInsert]
GO
/****** Object:  Trigger [tblThreadCheckoutDetail_AfterUpdate]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblThreadCheckoutDetail_AfterUpdate]
GO
/****** Object:  Trigger [tblThreadCheckoutDetail_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblThreadCheckoutDetail_AfterInsert]
GO
/****** Object:  Trigger [tblThreadCalibration_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblThreadCalibration_AfterInsert]
GO
/****** Object:  Trigger [tblPinCheckoutDetail_AfterUpdate]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblPinCheckoutDetail_AfterUpdate]
GO
/****** Object:  Trigger [tblPinCheckoutDetail_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
DROP TRIGGER [tblPinCheckoutDetail_AfterInsert]
GO
ALTER TABLE [tblTicketHistory] DROP CONSTRAINT [DF_tblTicketHistory_CreatedTimestamp]
GO
ALTER TABLE [tblTicket] DROP CONSTRAINT [DF_tblTicket_UpdatedTimestamp]
GO
ALTER TABLE [tblTicket] DROP CONSTRAINT [DF_tblTicket_CreatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutHistory] DROP CONSTRAINT [DF_tblThreadCheckoutHistory_CreatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutDetail] DROP CONSTRAINT [DF_tblThreadCheckoutDetail_UpdatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutDetail] DROP CONSTRAINT [DF_tblThreadCheckoutDetail_CreatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutDetail] DROP CONSTRAINT [DF_tblThreadCheckoutDetail_DailyCalibration]
GO
ALTER TABLE [tblThreadCalibration] DROP CONSTRAINT [DF_tblThreadCalibration_CreatedTimestamp]
GO
ALTER TABLE [tblPinCheckoutHistory] DROP CONSTRAINT [DF_tblPinCheckoutHistory_CreatedTimestamp]
GO
ALTER TABLE [tblPinCheckoutDetail] DROP CONSTRAINT [DF_tblPinCheckoutDetail_UpdatedTimestamp]
GO
ALTER TABLE [tblPinCheckoutDetail] DROP CONSTRAINT [DF_tblPinCheckoutDetail_CreatedTimestamp]
GO
ALTER TABLE [tblOverDueEmailRunLog] DROP CONSTRAINT [DF_tblOverDueEmailRunLog_RunDate]
GO
/****** Object:  Table [tblTicketHistory]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblTicketHistory]') AND type in (N'U'))
DROP TABLE [tblTicketHistory]
GO
/****** Object:  Table [tblTicket]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblTicket]') AND type in (N'U'))
DROP TABLE [tblTicket]
GO
/****** Object:  Table [tblThreadCheckoutHistory]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblThreadCheckoutHistory]') AND type in (N'U'))
DROP TABLE [tblThreadCheckoutHistory]
GO
/****** Object:  Table [tblThreadCheckoutDetail]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblThreadCheckoutDetail]') AND type in (N'U'))
DROP TABLE [tblThreadCheckoutDetail]
GO
/****** Object:  Table [tblThreadCalibration]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblThreadCalibration]') AND type in (N'U'))
DROP TABLE [tblThreadCalibration]
GO
/****** Object:  Table [tblPinCheckoutHistory]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblPinCheckoutHistory]') AND type in (N'U'))
DROP TABLE [tblPinCheckoutHistory]
GO
/****** Object:  Table [tblPinCheckoutDetail]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblPinCheckoutDetail]') AND type in (N'U'))
DROP TABLE [tblPinCheckoutDetail]
GO
/****** Object:  Table [tblOverDueEmailRunLog]    Script Date: 9/22/2025 7:11:10 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[tblOverDueEmailRunLog]') AND type in (N'U'))
DROP TABLE [tblOverDueEmailRunLog]
GO
/****** Object:  Table [tblOverDueEmailRunLog]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblOverDueEmailRunLog](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[SiteID] [int] NOT NULL,
	[RunDate] [datetime] NOT NULL,
	[UpdatedUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblOverDueEmailRunLog] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [tblPinCheckoutDetail]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblPinCheckoutDetail](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TicketID] [int] NOT NULL,
	[GageStatusID] [int] NOT NULL,
	[PinDiameter] [decimal](6, 4) NOT NULL,
	[PinTypeID] [int] NOT NULL,
	[BinID] [int] NULL,
	[LastCalibratedBy] [varchar](10) NULL,
	[LastCalibrationDate] [datetime] NULL,
	[CalibrationDueDate] [datetime] NULL,
	[CreatedTimestamp] [datetime] NOT NULL,
	[UpdatedTimestamp] [datetime] NOT NULL,
	[UpdateUserID] [varchar](10) NOT NULL
) ON [PRIMARY]
GO
/****** Object:  Table [tblPinCheckoutHistory]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblPinCheckoutHistory](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[PinCheckoutDetailID] [int] NOT NULL,
	[RecordEventTypeID] [int] NOT NULL,
	[PinCalibrationID] [int] NULL,
	[GageStatusID] [int] NOT NULL,
	[LastCalibratedBy] [varchar](10) NULL,
	[LastCalibrationDate] [datetime] NULL,
	[CalibrationDueDate] [datetime] NULL,
	[CreatedTimestamp] [datetime] NULL,
	[UpdateUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblPinCheckoutHistory] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [tblThreadCalibration]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblThreadCalibration](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[ThreadGageCheckoutDetailID] [int] NOT NULL,
	[CalibrationResultID] [int] NOT NULL,
	[RecordedGoThreadDiameter] [decimal](9, 5) NOT NULL,
	[RecordedNoGoThreadDiameter] [decimal](9, 5) NOT NULL,
	[RecordedMajorDiameter] [decimal](9, 5) NOT NULL,
	[CalibrationNotes] [varchar](2000) NULL,
	[CreatedTimestamp] [datetime] NOT NULL,
	[UpdateUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblThreadCalibration] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [tblThreadCheckoutDetail]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblThreadCheckoutDetail](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TicketID] [int] NOT NULL,
	[ThreadGageID] [int] NOT NULL,
	[GageStatusID] [int] NOT NULL,
	[LastCalibratedBy] [varchar](10) NULL,
	[LastCalibrationDate] [datetime] NULL,
	[DailyCalibration] [smallint] NOT NULL,
	[CalibrationDueDate] [datetime] NULL,
	[CreatedTimestamp] [datetime] NOT NULL,
	[UpdatedTimestamp] [datetime] NOT NULL,
	[UpdateUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblThreadCheckoutDetail] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [tblThreadCheckoutHistory]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblThreadCheckoutHistory](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[RecordEventTypeID] [int] NOT NULL,
	[ThreadGageCheckoutDetailID] [int] NOT NULL,
	[GageStatusID] [int] NOT NULL,
	[ThreadCalibrationID] [int] NULL,
	[LastCalibratedBy] [varchar](10) NULL,
	[LastCalibrationDate] [datetime] NULL,
	[CalibrationDueDate] [datetime] NULL,
	[CreatedTimestamp] [datetime] NOT NULL,
	[UpdateUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblThreadCheckoutHistory] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [tblTicket]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblTicket](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TicketGUID] [varchar](255) NULL,
	[SiteID] [int] NULL,
	[TicketNumber] [varchar](20) NULL,
	[TicketTypeID] [int] NOT NULL,
	[MachineName] [varchar](500) NOT NULL,
	[MachineGroupID] [int] NULL,
	[DepartmentID] [int] NOT NULL,
	[OperatorEmployeeNumber] [varchar](10) NULL,
	[OperatorName] [varchar](150) NULL,
	[TicketStatusID] [int] NOT NULL,
	[CellLeaderID] [int] NULL,
	[JobLotNumber] [varchar](50) NULL,
	[PartNumber] [varchar](50) NOT NULL,
	[CreatedTimestamp] [datetime] NOT NULL,
	[UpdatedTimestamp] [datetime] NOT NULL,
	[UpdateUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblTicket] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [tblTicketHistory]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [tblTicketHistory](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TicketID] [int] NOT NULL,
	[RecordEventTypeID] [int] NOT NULL,
	[TicketNumber] [varchar](20) NULL,
	[TicketTypeID] [int] NOT NULL,
	[MachineName] [varchar](500) NOT NULL,
	[MachineGroupID] [int] NULL,
	[DepartmentID] [int] NOT NULL,
	[OperatorEmployeeNumber] [varchar](10) NULL,
	[OperatorName] [varchar](150) NULL,
	[TicketStatusID] [int] NOT NULL,
	[CellLeaderID] [int] NULL,
	[JobLotNumber] [varchar](50) NULL,
	[PartNumber] [varchar](50) NOT NULL,
	[CreatedTimestamp] [datetime] NOT NULL,
	[UpdateUserID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_tblTicketHistory] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [tblOverDueEmailRunLog] ADD  CONSTRAINT [DF_tblOverDueEmailRunLog_RunDate]  DEFAULT (getdate()) FOR [RunDate]
GO
ALTER TABLE [tblPinCheckoutDetail] ADD  CONSTRAINT [DF_tblPinCheckoutDetail_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
ALTER TABLE [tblPinCheckoutDetail] ADD  CONSTRAINT [DF_tblPinCheckoutDetail_UpdatedTimestamp]  DEFAULT (getdate()) FOR [UpdatedTimestamp]
GO
ALTER TABLE [tblPinCheckoutHistory] ADD  CONSTRAINT [DF_tblPinCheckoutHistory_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
ALTER TABLE [tblThreadCalibration] ADD  CONSTRAINT [DF_tblThreadCalibration_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutDetail] ADD  CONSTRAINT [DF_tblThreadCheckoutDetail_DailyCalibration]  DEFAULT ((0)) FOR [DailyCalibration]
GO
ALTER TABLE [tblThreadCheckoutDetail] ADD  CONSTRAINT [DF_tblThreadCheckoutDetail_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutDetail] ADD  CONSTRAINT [DF_tblThreadCheckoutDetail_UpdatedTimestamp]  DEFAULT (getdate()) FOR [UpdatedTimestamp]
GO
ALTER TABLE [tblThreadCheckoutHistory] ADD  CONSTRAINT [DF_tblThreadCheckoutHistory_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
ALTER TABLE [tblTicket] ADD  CONSTRAINT [DF_tblTicket_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
ALTER TABLE [tblTicket] ADD  CONSTRAINT [DF_tblTicket_UpdatedTimestamp]  DEFAULT (getdate()) FOR [UpdatedTimestamp]
GO
ALTER TABLE [tblTicketHistory] ADD  CONSTRAINT [DF_tblTicketHistory_CreatedTimestamp]  DEFAULT (getdate()) FOR [CreatedTimestamp]
GO
/****** Object:  Trigger [tblPinCheckoutDetail_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE TRIGGER [tblPinCheckoutDetail_AfterInsert]
   ON  [tblPinCheckoutDetail]
   AFTER INSERT
AS 
BEGIN

	SET NOCOUNT ON;
	DECLARE @pin_checkout_detail_id as INT = (Select ID from INSERTED)
	DECLARE @ticket_id INT = (Select TicketID from INSERTED)
	DECLARE @ticket_status_id INT = (Select TicketStatusID from tblTicket where ID = @ticket_id)
	DECLARE @calibration_due_date as DATE 

	IF @ticket_status_id = 2
		/*Ticket Is Active*/
		BEGIN
			EXEC spGetPinCalibrationDueDate @pin_checkout_detail_id, @calibration_due_date OUTPUT
			INSERT INTO [dbo].[tblPinCheckoutHistory]
							([PinCheckoutDetailID]
							,[GageStatusID]
							,[RecordEventTypeID]
							,CalibrationDueDate
							,[UpdateUserID])
				Select ID, GageStatusID, 1, @calibration_due_date, UpdateUserID From INSERTED

			 Update tblPinCheckoutDetail SET CalibrationDueDate = @calibration_due_date
			 WHERE ID = @pin_checkout_detail_id
		END
		ELSE
			/*Ticket Is Staged*/
			BEGIN
				INSERT INTO [dbo].[tblPinCheckoutHistory]
							([PinCheckoutDetailID]
							,[GageStatusID]
							,[RecordEventTypeID]
							,[UpdateUserID])
				Select ID, GageStatusID, 1, UpdateUserID From INSERTED
			END
END

GO
ALTER TABLE [dbo].[tblPinCheckoutDetail] ENABLE TRIGGER [tblPinCheckoutDetail_AfterInsert]
GO
/****** Object:  Trigger [tblPinCheckoutDetail_AfterUpdate]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE TRIGGER [tblPinCheckoutDetail_AfterUpdate]
   ON  [tblPinCheckoutDetail]
   AFTER Update
AS 
BEGIN

	SET NOCOUNT ON;
	if (NOT UPDATE(LastCalibrationDate))
		BEGIN
			INSERT INTO [dbo].[tblPinCheckoutHistory]
				   ([PinCheckoutDetailID]
				   ,[GageStatusID]
				   ,[RecordEventTypeID]
				   ,LastCalibratedBy
				   ,LastCalibrationDate
				   ,CalibrationDueDate
				   ,[UpdateUserID])
			 Select ID, GageStatusID, 2, LastCalibratedBy, LastCalibrationDate, CalibrationDueDate, UpdateUserID From INSERTED
		END
END

GO
ALTER TABLE [dbo].[tblPinCheckoutDetail] ENABLE TRIGGER [tblPinCheckoutDetail_AfterUpdate]
GO
/****** Object:  Trigger [tblThreadCalibration_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE TRIGGER [tblThreadCalibration_AfterInsert] 
   ON  [tblThreadCalibration]
   AFTER INSERT
AS 
BEGIN

	SET NOCOUNT ON;
	INSERT INTO tblThreadCheckoutHistory ( 
			ThreadGageCheckoutDetailID, 
			GageStatusID, 
			RecordEventTypeID, 
			ThreadCalibrationID, 
			LastCalibratedBy, 
			LastCalibrationDate, 
			UpdateUserID )
	SELECT	inserted.ThreadGageCheckoutDetailID, 
			tblThreadCheckoutDetail.GageStatusID, 
			3 AS RecordEventTypeID, 
			inserted.ID,
			Inserted.UpdateUserID,
			CURRENT_TIMESTAMP,
			inserted.UpdateUserID
	FROM tblThreadCheckoutDetail 
	INNER JOIN inserted 
	ON tblThreadCheckoutDetail.ID = inserted.ThreadGageCheckoutDetailID

	


END
GO
ALTER TABLE [dbo].[tblThreadCalibration] ENABLE TRIGGER [tblThreadCalibration_AfterInsert]
GO
/****** Object:  Trigger [tblThreadCheckoutDetail_AfterInsert]    Script Date: 9/22/2025 7:11:10 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE TRIGGER [tblThreadCheckoutDetail_AfterInsert]
   ON  [tblThreadCheckoutDetail]
   AFTER INSERT
AS 
BEGIN

	SET NOCOUNT ON;
	Declare @thread_checkout_detail_id as INT = (Select ID from INSERTED)
	Declare @calibration_due_date as DATE 
	DECLARE @ticket_id INT = (Select TicketID from INSERTED)
	DECLARE @ticket_status_id INT = (Select TicketStatusID from tblTicket where ID = @ticket_id)
	
	IF @ticket_status_id = 2
		/*Ticket Is Active*/
		BEGIN
			EXEC spGetThreadCalibrationDueDate @thread_checkout_detail_id, @calibration_due_date OUTPUT
			INSERT INTO [dbo].[tblThreadCheckoutHistory]
							([ThreadGageCheckoutDetailID]
							,[GageStatusID]
							,[RecordEventTypeID]
							,CalibrationDueDate
							,[UpdateUserID])
				Select ID, GageStatusID, 1, @calibration_due_date, UpdateUserID From INSERTED

			 Update tblThreadCheckoutDetail SET CalibrationDueDate = @calibration_due_date
			 WHERE ID = @thread_checkout_detail_id
		END
		ELSE
			/*Ticket Is Staged*/
			BEGIN
				INSERT INTO [dbo].[tblThreadCheckoutHistory]
							([ThreadGageCheckoutDetailID]
							,[GageStatusID]
							,[RecordEventTypeID]
							,[UpdateUserID])
				Select ID, GageStatusID, 1, UpdateUserID From INSERTED
			END
END

GO
ALTER TABLE [dbo].[tblThreadCheckoutDetail] ENABLE TRIGGER [tblThreadCheckoutDetail_AfterInsert]
GO
/****** Object:  Trigger [tblThreadCheckoutDetail_AfterUpdate]    Script Date: 9/22/2025 7:11:11 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO




CREATE TRIGGER [tblThreadCheckoutDetail_AfterUpdate]
   ON  [tblThreadCheckoutDetail]
   AFTER Update
AS 
BEGIN
	SET NOCOUNT ON;

	if (NOT UPDATE(LastCalibrationDate))
		BEGIN
			INSERT INTO [dbo].[tblThreadCheckoutHistory]
				   ([ThreadGageCheckoutDetailID]
				   ,[GageStatusID]
				   ,[RecordEventTypeID]
				   ,LastCalibratedBy
				   ,LastCalibrationDate
				   ,CalibrationDueDate
				   ,[UpdateUserID])
			 Select ID, GageStatusID, 2, LastCalibratedBy, LastCalibrationDate, CalibrationDueDate, UpdateUserID From INSERTED
		END
END

GO
ALTER TABLE [dbo].[tblThreadCheckoutDetail] ENABLE TRIGGER [tblThreadCheckoutDetail_AfterUpdate]
GO
/****** Object:  Trigger [tblTicket_AfterInsert]    Script Date: 9/22/2025 7:11:11 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE TRIGGER [tblTicket_AfterInsert]
   ON  [tblTicket]
   AFTER INSERT
AS 
BEGIN


	SET NOCOUNT ON;

	Declare @ticket_number varchar(50)
	Declare @id int = (select ID from Inserted)
	Declare @display_id int
	Declare @ttid int = (select TicketTypeID from Inserted)

	Set @display_id = @id + 10000
	if @ttid = 1
		Begin
		 SET @ticket_number = 'P-' + Cast(@display_id as varchar)
		END
	else if  @ttid = 2
		BEGIN
			SET @ticket_number = 'T-' + Cast(@display_id as varchar)
		END

		Update tblTicket Set TicketNumber = @ticket_number WHERE ID = @id


    INSERT INTO tblTicketHistory
           ([TicketID]
           ,[TicketNumber]
           ,[TicketTypeID]
		   ,RecordEventTypeID
           ,[MachineName]
           ,[MachineGroupID]
           ,[DepartmentID]
           ,[OperatorEmployeeNumber]
           ,[OperatorName]
           ,[TicketStatusID]
           ,[CellLeaderID]
           ,[JobLotNumber]
           ,[PartNumber]
           ,[UpdateUserID])
     SELECT [ID]
      ,@ticket_number
      ,[TicketTypeID]
	  , 1
      ,[MachineName]
      ,[MachineGroupID]
      ,[DepartmentID]
      ,[OperatorEmployeeNumber]
      ,[OperatorName]
      ,[TicketStatusID]
      ,[CellLeaderID]
      ,[JobLotNumber]
      ,[PartNumber]
      ,[UpdateUserID] 
	 From INSERTED


END

GO
ALTER TABLE [dbo].[tblTicket] ENABLE TRIGGER [tblTicket_AfterInsert]
GO
/****** Object:  Trigger [tblTicket_AfterUpdate]    Script Date: 9/22/2025 7:11:11 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TRIGGER [tblTicket_AfterUpdate]
   ON  [tblTicket]
   AFTER Update
AS 
BEGIN

	SET NOCOUNT ON;
	if (NOT UPDATE(TicketNumber)) 
	 BEGIN
				INSERT INTO tblTicketHistory
							 ([TicketID]
							 ,[TicketNumber]
							 ,[TicketTypeID]
					 ,RecordEventTypeID
							 ,[MachineName]
							 ,[MachineGroupID]
							 ,[DepartmentID]
							 ,[OperatorEmployeeNumber]
							 ,[OperatorName]
							 ,[TicketStatusID]
							 ,[CellLeaderID]
							 ,[JobLotNumber]
							 ,[PartNumber]
							 ,[UpdateUserID])
				 SELECT [ID]
					,[TicketNumber]
					,[TicketTypeID]
				, 2
					,[MachineName]
					,[MachineGroupID]
					,[DepartmentID]
					,[OperatorEmployeeNumber]
					,[OperatorName]
					,[TicketStatusID]
					,[CellLeaderID]
					,[JobLotNumber]
					,[PartNumber]
					,[UpdateUserID] 
		
			 From INSERTED
	 END
END


GO
ALTER TABLE [dbo].[tblTicket] ENABLE TRIGGER [tblTicket_AfterUpdate]
GO
