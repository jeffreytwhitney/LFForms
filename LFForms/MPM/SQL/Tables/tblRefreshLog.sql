CREATE TABLE [dbo].[tblRefreshLog] (
    [ID]               INT            IDENTITY (1, 1) NOT NULL,
    [CreatedTimestamp] DATETIME       CONSTRAINT [DF_tblRefreshLog_CreatedTimestamp] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) NULL
);

