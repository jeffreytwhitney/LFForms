CREATE TABLE [dbo].[tblProjectOwner] (
    [ID]                 INT            IDENTITY (1, 1) NOT NULL,
    [SiteID]             INT            NULL,
    [IsActive]           BIT            NULL,
    [ProjectOwnerTypeID] INT            NULL,
    [FName]              NVARCHAR (255) NULL,
    [LName]              NVARCHAR (255) NULL,
    [DepartmentID]       INT            NULL,
    [EMailAddress]       NVARCHAR (255) NULL,
    [NetworkUserName]    NVARCHAR (255) NULL,
    [EmployeeNumber]     NVARCHAR (255) NULL,
    [CreatedTimestamp]   DATETIME       CONSTRAINT [DF_tblProjectOwner_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp]   DATETIME       CONSTRAINT [DF_tblProjectOwner_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]       NVARCHAR (255) NULL
);

