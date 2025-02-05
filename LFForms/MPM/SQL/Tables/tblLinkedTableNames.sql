CREATE TABLE [dbo].[tblLinkedTableNames] (
    [ID]                      INT            IDENTITY (1, 1) NOT NULL,
    [SiteID]                  INT            NULL,
    [IsActive]                BIT            NULL,
    [ImportName]              NVARCHAR (255) NULL,
    [FilePath]                NTEXT          NULL,
    [SheetName]               NVARCHAR (255) NULL,
    [PartNumberCellName]      NVARCHAR (255) NULL,
    [CompletionDateOffset]    INT            NULL,
    [MachineNameOffsetLeft]   INT            NULL,
    [MachineNameOffsetUp]     INT            NULL,
    [TaskNameDelimiter]       NVARCHAR (255) NULL,
    [CompletionDateDelimeter] NVARCHAR (255) NULL,
    [DoPartNameTrimming]      BIT            NULL
);

