USE [LF_RMS_COMMS_MPM]
GO

/****** Object: SqlProcedure [dbo].[spTASK_GetFilteredTaskList] Script Date: 1/2/2025 5:44:41 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP PROCEDURE [dbo].[spTASK_GetFilteredTaskList];


GO

CREATE PROCEDURE [dbo].[spTASK_GetFilteredTaskList]
	@include_not_scheduled smallint,
	@exclude_waiting_on_part smallint

AS
	BEGIN
		SET NOCOUNT ON;

		DECLARE @sql varchar(max) = '';
		DECLARE @is_where_added smallint = 0;

		If @include_not_scheduled IS NULL OR @include_not_scheduled = 0
			BEGIN
				if @is_where_added = 1
					SET @sql = @sql + ' AND StatusID <> 7';
				else
					BEGIN
						SET @sql = @sql + ' WHERE StatusID <> 7';
						SET @is_where_added = 1;
					END
			END

		If @exclude_waiting_on_part IS NOT NULL AND @exclude_waiting_on_part = 1
		BEGIN
				if @is_where_added = 1
					SET @sql = @sql + ' AND StatusID <> 3';
				else
					BEGIN
						SET @sql = @sql + ' WHERE StatusID <> 3';
						SET @is_where_added = 1;
					END
			END

		

		Set @sql = @sql + ' ORDER BY DueDate, ScheduledDueDate, TaskName';
		Exec(@sql);


	END
