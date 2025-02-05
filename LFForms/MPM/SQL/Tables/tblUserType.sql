CREATE TABLE [dbo].[tblUserType] (
    [ID]       INT           IDENTITY (1, 1) NOT NULL,
    [UserType] VARCHAR (255) NOT NULL,
    CONSTRAINT [PK_tblUserType] PRIMARY KEY CLUSTERED ([ID] ASC)
);

