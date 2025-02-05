CREATE TABLE [dbo].[tblAudit_Task] (
    [ID]               INT            IDENTITY (1, 1) NOT NULL,
    [SiteID]           INT            NULL,
    [RecordEventType]  NVARCHAR (255) NULL,
    [TaskID]           INT            NULL,
    [ProjectID]        INT            NULL,
    [StatusID]         INT            NULL,
    [TaskName]         NVARCHAR (255) NULL,
    [TicketNumber]     NVARCHAR (255) NULL,
    [DrawingNumber]    NVARCHAR (255) NULL,
    [DueDate]          DATETIME       NULL,
    [ScheduledDueDate] DATETIME       NULL,
    [EstimatedHours]   INT            NULL,
    [TaskTypeID]       INT            NULL,
    [AssignedToID]     INT            NULL,
    [DateStarted]      DATETIME       NULL,
    [DateCompleted]    DATETIME       NULL,
    [ManualDueDate]    SMALLINT       NULL,
    [CreatedDateStamp] DATETIME       CONSTRAINT [DF_tblAudit_Task_CTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) NULL
);

