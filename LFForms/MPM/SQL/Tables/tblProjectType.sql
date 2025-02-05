CREATE TABLE [dbo].[tblProjectType] (
    [ID]          INT            IDENTITY (1, 1) NOT NULL,
    [ProjectType] NVARCHAR (255) NOT NULL,
    CONSTRAINT [PK_tblProjectType] PRIMARY KEY CLUSTERED ([ID] ASC)
);

