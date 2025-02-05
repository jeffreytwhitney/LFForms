CREATE TABLE [dbo].[tblUser] (
    [ID]               INT            IDENTITY (1, 1) NOT NULL,
    [SiteID]           INT            NULL,
    [DepartmentID]     INT            NULL,
    [UserTypeID]       INT            NULL,
    [IsActive]         SMALLINT       NULL,
    [FName]            NVARCHAR (255) NULL,
    [LName]            NVARCHAR (255) NULL,
    [EmployeeNumber]   NVARCHAR (255) NULL,
    [EMailAddress]     NVARCHAR (255) NULL,
    [NetworkUserName]  NVARCHAR (255) NULL,
    [IsAdmin]          SMALLINT       NULL,
    [CreatedTimestamp] DATETIME       CONSTRAINT [DF_tblUser_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp] DATETIME       CONSTRAINT [DF_tblUser_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) NULL
);

