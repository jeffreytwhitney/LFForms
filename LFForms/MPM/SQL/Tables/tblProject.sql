CREATE TABLE [dbo].[tblProject] (
    [ID]                       INT             IDENTITY (1, 1) NOT NULL,
    [SiteID]                   INT             NULL,
    [ProjectTypeID]            INT             NULL,
    [ProjectName]              NVARCHAR (255)  NULL,
    [ProjectDescription]       NTEXT           NULL,
    [DepartmentID]             INT             NULL,
    [PrimaryProjectOwnerID]    INT             NULL,
    [SecondaryProjectOwnerID]  INT             NULL,
    [TertiaryProjectOwnerID]   INT             NULL,
    [InitiatorEmployeeID]      INT             NULL,
    [InitiatorEmailCarbonCopy] NVARCHAR (1000) NULL,
    [CountOfActiveTasks]       INT             NULL,
    [CreatedTimestamp]         DATETIME        CONSTRAINT [DF_tblProject_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp]         DATETIME        CONSTRAINT [DF_tblProject_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]             NVARCHAR (255)  NULL
);


GO







CREATE TRIGGER [dbo].[tblProject_AfterInsert]
   ON  [dbo].[tblProject]
   AFTER INSERT
AS 
BEGIN
	SET NOCOUNT ON;
	
INSERT INTO [dbo].[tblAudit_Project]
           ([RecordEventType]
           ,[ProjectID]
		   ,[SiteID]
           ,[ProjectName]
           ,[DepartmentID]
           ,[PrimaryProjectOwnerID]
           ,[SecondaryProjectOwnerID]
           ,[TertiaryProjectOwnerID]
           ,[CountOfActiveProjects]
           ,[UpdateUserID])
		SELECT 'Created' as RecordEventType
			,[ID]
			,[SiteID]
			,[ProjectName]
			,[DepartmentID]
			,[PrimaryProjectOwnerID]
			,[SecondaryProjectOwnerID]
			,[TertiaryProjectOwnerID]
			,[CountOfActiveTasks]
			,[UpdateUserID]
		FROM INSERTED


END
GO






CREATE   TRIGGER [dbo].[tblProject_AfterUpdate]
   ON  [dbo].[tblProject]
   AFTER UPDATE
AS 
BEGIN
	SET NOCOUNT ON;
	
INSERT INTO [dbo].[tblAudit_Project]
           ([RecordEventType]
		   ,[ProjectID]
		   ,[SiteID]
           ,[ProjectName]
           ,[DepartmentID]
           ,[PrimaryProjectOwnerID]
           ,[SecondaryProjectOwnerID]
           ,[TertiaryProjectOwnerID]
           ,[CountOfActiveProjects]
           ,[UpdateUserID])
		SELECT 'Updated' as RecordEventType
			,[ID]
			,[SiteID]
			,[ProjectName]
			,[DepartmentID]
			,[PrimaryProjectOwnerID]
			,[SecondaryProjectOwnerID]
			,[TertiaryProjectOwnerID]
			,[CountOfActiveTasks]
			,[UpdateUserID]
		FROM INSERTED


END