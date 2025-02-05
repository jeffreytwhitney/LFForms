CREATE TABLE [dbo].[tblDepartment] (
    [ID]                  INT            IDENTITY (1, 1) NOT NULL,
    [SiteID]              INT            NULL,
    [DepartmentName]      NVARCHAR (255) NULL,
    [ParentID]            INT            NULL,
    [QualityCCList]       VARCHAR (500)  NULL,
    [ManufacturingCCList] VARCHAR (500)  NULL,
    [CellLeadCCList]      VARCHAR (500)  NULL,
    [CreatedTimestamp]    DATETIME       CONSTRAINT [DF_tblDepartment_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp]    DATETIME       CONSTRAINT [DF_tblDepartment_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]        NVARCHAR (255) NULL
);

