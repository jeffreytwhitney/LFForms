CREATE TABLE [dbo].[tblAudit_Project] (
    [ID]                      INT            IDENTITY (1, 1) NOT NULL,
    [SiteID]                  INT            NULL,
    [RecordEventType]         NVARCHAR (255) NULL,
    [ProjectID]               INT            NULL,
    [ProjectName]             NVARCHAR (255) NULL,
    [ProjectDescription]      NTEXT          NULL,
    [DepartmentID]            INT            NULL,
    [PrimaryProjectOwnerID]   INT            NULL,
    [SecondaryProjectOwnerID] INT            NULL,
    [TertiaryProjectOwnerID]  INT            NULL,
    [CountOfActiveProjects]   INT            NULL,
    [CreatedTimestamp]        DATETIME       CONSTRAINT [DF_tblAudit_Project_CTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]            NVARCHAR (255) NULL
);

