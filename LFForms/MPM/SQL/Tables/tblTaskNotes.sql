CREATE TABLE [dbo].[tblTaskNotes] (
    [ID]               INT            IDENTITY (1, 1) NOT NULL,
    [TaskID]           INT            NULL,
    [TaskNote]         VARCHAR (MAX)  NULL,
    [CreatedTimestamp] DATETIME       CONSTRAINT [DF_tblTaskNotes_CTS] DEFAULT (getdate()) NULL,
    [UpdatedTimestamp] DATETIME       CONSTRAINT [DF_tblTaskNotes_UTS] DEFAULT (getdate()) NULL,
    [UpdateUserID]     NVARCHAR (255) NULL,
    [IsNoteAutomated]  SMALLINT       DEFAULT ((1)) NULL
);

