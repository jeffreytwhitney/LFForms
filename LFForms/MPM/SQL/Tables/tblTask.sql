CREATE TABLE [dbo].[tblTask] (
    [ID]               INT            IDENTITY (1, 1) NOT NULL,
    [ProjectID]        INT            NULL,
    [StatusID]         INT            NULL,
    [TaskName]         NVARCHAR (255) CONSTRAINT [DF_tblTask_TaskName] DEFAULT ('') NULL,
    [TicketNumber]     NVARCHAR (255) CONSTRAINT [DF_tblTask_TicketNumber] DEFAULT ('') NULL,
    [DrawingNumber]    NVARCHAR (255) CONSTRAINT [DF_tblTask_DrawingNumber] DEFAULT ('') NULL,
    [DueDate]          DATETIME       NULL,
    [CustomerRev]      NVARCHAR (15)  NULL,
    [ManufacturingRev] NVARCHAR (15)  NULL,
    [Operation]        NVARCHAR (15)  NULL,
    [ScheduledDueDate] DATETIME       NULL,
    [EstimatedHours]   INT            CONSTRAINT [DF_tblTask_EstimatedHours] DEFAULT ((0)) NULL,
    [TaskTypeID]       INT            CONSTRAINT [DF_tblTask_TaskTypeID] DEFAULT ((1)) NULL,
    [AssignedToID]     INT            NULL,
    [DateStarted]      DATETIME       NULL,
    [DateCompleted]    DATETIME       NULL,
    [ManualDueDate]    SMALLINT       CONSTRAINT [DF_tblTask_ManualDueDate] DEFAULT ((0)) NULL,
    [HavePart]         SMALLINT       CONSTRAINT [DF_tblTask_HavePart] DEFAULT ((0)) NULL,
    [IUNumber]         NVARCHAR (255) CONSTRAINT [DF_tblTask_IUNumber] DEFAULT ('') NULL,
    [CreatedTimestamp] DATETIME       CONSTRAINT [DF_tblTask_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp] DATETIME       CONSTRAINT [DF_tblTask_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) CONSTRAINT [DF_tblTask_UpdateUserID] DEFAULT ('') NULL
);


GO
CREATE NONCLUSTERED INDEX [IDX_tblTask_Assignee]
    ON [dbo].[tblTask]([AssignedToID] ASC);


GO
CREATE NONCLUSTERED INDEX [Idx_tblTask_TaskName]
    ON [dbo].[tblTask]([TaskName] ASC);


GO

CREATE TRIGGER [dbo].[tblTask_AfterInsert]
   ON  [dbo].[tblTask]
   AFTER Insert
AS 
BEGIN
	SET NOCOUNT ON;
	
	INSERT INTO [dbo].[tblAudit_Task]
           ([RecordEventType]
           ,[TaskID]
           ,[ProjectID]
           ,[StatusID]
           ,[TaskName]
           ,[TicketNumber]
           ,[DrawingNumber]
           ,[DueDate]
           ,[ScheduledDueDate]
           ,[EstimatedHours]
           ,[TaskTypeID]
           ,[AssignedToID]
           ,[DateStarted]
           ,[DateCompleted]
           ,[ManualDueDate]
           ,[UpdateUserID])
		SELECT 'Created' as RecordEventType
			,[ID]
			,[ProjectID]
			,[StatusID]
			,[TaskName]
			,[TicketNumber]
			,[DrawingNumber]
			,[DueDate]
			,[ScheduledDueDate]
			,[EstimatedHours]
			,[TaskTypeID]
			,[AssignedToID]
			,[DateStarted]
			,[DateCompleted]
			,[ManualDueDate]
			,[UpdateUserID]
		From INSERTED


END
GO


CREATE TRIGGER [dbo].[tblTask_AfterUpdate]
   ON  [dbo].[tblTask]
   AFTER UPDATE
AS 
BEGIN
	SET NOCOUNT ON;
	
	INSERT INTO [dbo].[tblAudit_Task]
           ([RecordEventType]
           ,[TaskID]
           ,[ProjectID]
           ,[StatusID]
           ,[TaskName]
           ,[TicketNumber]
           ,[DrawingNumber]
           ,[DueDate]
           ,[ScheduledDueDate]
           ,[EstimatedHours]
           ,[TaskTypeID]
           ,[AssignedToID]
           ,[DateStarted]
           ,[DateCompleted]
           ,[ManualDueDate]
           ,[UpdateUserID])
		SELECT 'Updated' as RecordEventType
			,[ID]
			,[ProjectID]
			,[StatusID]
			,[TaskName]
			,[TicketNumber]
			,[DrawingNumber]
			,[DueDate]
			,[ScheduledDueDate]
			,[EstimatedHours]
			,[TaskTypeID]
			,[AssignedToID]
			,[DateStarted]
			,[DateCompleted]
			,[ManualDueDate]
			,[UpdateUserID]
		From INSERTED


END