USE [LF_RMS_COMMS_MPM]
GO

/****** Object:  UserDefinedFunction [dbo].[fn_GetNextMaintenanceDueDate]    Script Date: 11/11/2026 11:03:04 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE OR ALTER     FUNCTION [dbo].[fn_GetNextMaintenanceDueDate]
(
    @MetrologyMachineID int
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        adjusted.NextMaintenanceDueDate
    FROM dbo.tblMetrologyMachine AS machine
    INNER JOIN dbo.tblMetrologyMachineType AS machineType
        ON machineType.ID = machine.MetrologyMachineTypeID

    CROSS APPLY
    (
        SELECT MAX(CAST(pm.MaintenanceDueDate AS date)) AS MaxDueDate
        FROM dbo.tblPreventativeMaintenance AS pm
        WHERE pm.MetrologyMachineID = machine.ID
    ) AS latest

    CROSS APPLY
    (
        SELECT EOMONTH(DATEADD(
            MONTH,
            machineType.MaintenanceIntervalMonths,
            latest.MaxDueDate
        )) AS MonthEnd
    ) AS candidate

    CROSS APPLY
    (
        -- 1900-01-01 was Monday; independent of SET DATEFIRST.
        SELECT (
            (
                DATEDIFF(
                    DAY,
                    CONVERT(date, '19000101', 112),
                    candidate.MonthEnd
                ) % 7
            ) + 7
        ) % 7 AS WeekdayIndex
    ) AS weekdayNumber

    CROSS APPLY
    (
        SELECT DATEADD(
            DAY,
            CASE weekdayNumber.WeekdayIndex
                WHEN 5 THEN -1  -- Saturday
                WHEN 6 THEN -2  -- Sunday
                ELSE 0
            END,
            candidate.MonthEnd
        ) AS NextMaintenanceDueDate
    ) AS adjusted

    CROSS APPLY
    (
        SELECT CAST(GETDATE() AS date) AS Today
    ) AS currentDate

    WHERE machine.ID = @MetrologyMachineID
      AND machineType.MaintenanceIntervalMonths <> 0
      AND EOMONTH(adjusted.NextMaintenanceDueDate) = EOMONTH(currentDate.Today)
);
GO
