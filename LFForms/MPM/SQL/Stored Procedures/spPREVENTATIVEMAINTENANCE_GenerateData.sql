USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  StoredProcedure [dbo].[spPREVENTATIVEMAINTENANCE_GenerateData]    Script Date: 11/11/2026 11:52:00 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE OR ALTER     PROCEDURE [dbo].[spPREVENTATIVEMAINTENANCE_GenerateData]
    @site_id int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @AssigneeID int;

SELECT
    @AssigneeID = site.PreventativeMaintenanceDefaultAssignee
FROM dbo.tblSite AS site
WHERE site.ID = @site_id;

IF @AssigneeID IS NULL
BEGIN
        RAISERROR('The site does not exist or has no default maintenance assignee.', 16, 1);
        RETURN;
END;

INSERT INTO dbo.tblPreventativeMaintenance
(
    MetrologyMachineID,
    MaintenanceDueDate,
    AssigneeID,
    IsComplete,
    CompletionDate,
    Notes,
    EmailSent
)
SELECT
    machine.ID,
    due.NextMaintenanceDueDate,
    @AssigneeID,
    0,
    NULL,
    NULL,
    0
FROM dbo.tblMetrologyMachine AS machine
    CROSS APPLY dbo.fn_GetNextMaintenanceDueDate(machine.ID) AS due
WHERE machine.SiteID = @site_id
  AND machine.IsActive = 1
  AND NOT EXISTS
    (
    SELECT 1
    FROM dbo.tblPreventativeMaintenance AS existing
    WITH (UPDLOCK, HOLDLOCK)
    WHERE existing.MetrologyMachineID = machine.ID
  AND existing.MaintenanceDueDate = due.NextMaintenanceDueDate
    );
END

GO


