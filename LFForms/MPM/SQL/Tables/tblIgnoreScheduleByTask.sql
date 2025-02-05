CREATE TABLE [dbo].[tblIgnoreScheduleByTask] (
    [ID]                 INT            IDENTITY (1, 1) NOT NULL,
    [TaskID]             INT            NULL,
    [TaskName]           NVARCHAR (255) NULL,
    [ScheduleIDToIgnore] INT            NULL
);

