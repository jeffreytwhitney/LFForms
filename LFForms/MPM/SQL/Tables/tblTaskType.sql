CREATE TABLE [dbo].[tblTaskType] (
    [ID]                     INT            IDENTITY (1, 1) NOT NULL,
    [IsActive]               BIT            NULL,
    [TaskType]               NVARCHAR (255) NULL,
    [TaskTypeGroupID]        INT            NULL,
    [AverageCompletionHours] INT            NULL,
    [RequiresJobNumber]      SMALLINT       NOT NULL,
    [CreatedTimestamp]       DATETIME       CONSTRAINT [DF_tblTaskType_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp]       DATETIME       CONSTRAINT [DF_tblTaskType_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]           NVARCHAR (255) NULL
);

