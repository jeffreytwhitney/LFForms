CREATE TABLE [dbo].[tblStatus] (
    [ID]                    INT            IDENTITY (1, 1) NOT NULL,
    [Status]                NVARCHAR (255) NULL,
    [DefaultToTrue]         BIT            NULL,
    [IsCompleteOrCancelled] BIT            NULL,
    [CreatedTimestamp]      DATETIME       CONSTRAINT [DF_tblStatus_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp]      DATETIME       CONSTRAINT [DF_tblStatus_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]          NVARCHAR (255) NULL
);

