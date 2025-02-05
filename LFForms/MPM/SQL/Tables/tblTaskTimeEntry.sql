CREATE TABLE [dbo].[tblTaskTimeEntry] (
    [ID]               INT            IDENTITY (1, 1) NOT NULL,
    [AssignedToID]     INT            NULL,
    [EntryDate]        DATETIME       NULL,
    [TaskID]           INT            NULL,
    [Hours]            DECIMAL (6, 2) NULL,
    [CreatedTimestamp] DATETIME       CONSTRAINT [DF_tblTaskTimeEntry_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp] DATETIME       CONSTRAINT [DF_tblTaskTimeEntry_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) NULL
);

