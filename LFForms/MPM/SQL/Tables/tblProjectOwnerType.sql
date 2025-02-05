CREATE TABLE [dbo].[tblProjectOwnerType] (
    [ID]               INT            NULL,
    [OwnerTypeName]    NVARCHAR (255) NULL,
    [CreatedTimestamp] DATETIME       CONSTRAINT [DF_tblProjectOwnerType_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp] DATETIME       CONSTRAINT [DF_tblProjectOwnerType_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) NULL
);

