CREATE TABLE [dbo].[tblJobNumber] (
    [ID]        INT            IDENTITY (1, 1) NOT NULL,
    [ProjectID] INT            NULL,
    [TaskName]  NVARCHAR (255) NULL,
    [JobNumber] NVARCHAR (255) NULL
);

