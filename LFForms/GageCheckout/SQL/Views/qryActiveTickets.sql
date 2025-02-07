USE [GageCheckout]
GO

/****** Object: View [dbo].[qryActiveTickets] Script Date: 2/6/2025 1:13:41 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DROP VIEW [dbo].[qryActiveTickets];


GO
CREATE VIEW dbo.qryActiveTickets
AS
SELECT        dbo.tblTicket.SiteID, dbo.tblTicket.TicketNumber, dbo.tblTicket.TicketGUID, dbo.tblTicket.TicketTypeID, dbo.tblTicket.MachineName, dbo.tblTicket.MachineGroupID, dbo.tblTicket.DepartmentID, dbo.tblTicket.OperatorEmployeeNumber, 
                         dbo.tblTicket.OperatorName, dbo.tblTicket.TicketStatusID, dbo.tblTicket.CellLeaderID, dbo.tblTicket.JobLotNumber, dbo.tblTicket.PartNumber, dbo.tblTicket.CreatedTimestamp, dbo.tblTicket.UpdatedTimestamp, 
                         dbo.tblTicket.UpdateUserID, dbo.tlkpDepartment.Department, dbo.qryMachineGroups.MachineGroupName, dbo.tlkpCellLeaders.FullName AS CellLeaderName, dbo.tlkpTicketStatus.TicketStatus, dbo.tblSite.SiteName, 
                         dbo.tlkpTicketType.TicketType, dbo.quniLastCalibrationDate.CalibrationDueDate, dbo.quniLastCalibrationDate.LastCalibrationDate, dbo.quniLastCalibrationDate.LastCalibratedBy, dbo.tblTicket.ID
FROM            dbo.tblTicket LEFT OUTER JOIN
                         dbo.quniLastCalibrationDate ON dbo.tblTicket.ID = dbo.quniLastCalibrationDate.TicketID LEFT OUTER JOIN
                         dbo.tlkpTicketType ON dbo.tblTicket.TicketTypeID = dbo.tlkpTicketType.ID LEFT OUTER JOIN
                         dbo.tblSite ON dbo.tblTicket.SiteID = dbo.tblSite.ID LEFT OUTER JOIN
                         dbo.tlkpTicketStatus ON dbo.tblTicket.TicketStatusID = dbo.tlkpTicketStatus.ID LEFT OUTER JOIN
                         dbo.tlkpCellLeaders ON dbo.tblTicket.CellLeaderID = dbo.tlkpCellLeaders.ID LEFT OUTER JOIN
                         dbo.qryMachineGroups ON dbo.tblTicket.MachineGroupID = dbo.qryMachineGroups.ID LEFT OUTER JOIN
                         dbo.tlkpDepartment ON dbo.tblTicket.DepartmentID = dbo.tlkpDepartment.ID
WHERE        (dbo.tblTicket.TicketStatusID = 1)
