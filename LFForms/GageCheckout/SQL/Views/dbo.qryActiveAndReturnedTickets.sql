USE [GageCheckout]
GO

/****** Object:  View [dbo].[qryActiveAndReturnedTickets]    Script Date: 6/8/2026 12:43:49 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER   VIEW [dbo].[qryActiveAndReturnedTickets]
AS
SELECT        dbo.tblTicket.SiteID, dbo.tblTicket.TicketNumber, dbo.tblTicket.TicketGUID, dbo.tblTicket.TicketTypeID, dbo.tblTicket.MachineName, dbo.tblTicket.MachineGroupID, dbo.tblTicket.DepartmentID,
              dbo.tblTicket.OperatorEmployeeNumber, dbo.tblTicket.OperatorName, dbo.tblTicket.TicketStatusID, dbo.tblTicket.CellLeaderID, dbo.tblTicket.JobLotNumber, dbo.tblTicket.PartNumber, dbo.tblTicket.CreatedTimestamp,
              dbo.tblTicket.UpdatedTimestamp, dbo.tblTicket.UpdateUserID, dbo.tlkpDepartment.Department, dbo.qryMachineGroups.MachineGroupName, dbo.tlkpCellLeaders.ShortName AS CellLeaderName,
              dbo.tlkpTicketStatus.TicketStatus, dbo.tblSite.SiteName, dbo.tlkpTicketType.TicketType, dbo.quniLastCalibrationDate.CalibrationDueDate, dbo.quniLastCalibrationDate.LastCalibrationDate,
              dbo.quniLastCalibrationDate.LastCalibratedBy, dbo.tblTicket.ID, dbo.tlkpCellLeaders.CellLeadEmailAddress,
              CASE WHEN dbo.quniLastCalibrationDate.CalibrationDueDate IS NOT NULL AND dbo.quniLastCalibrationDate.CalibrationDueDate < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END AS IsPastDueForCal
FROM            dbo.tblTicket LEFT OUTER JOIN
                dbo.quniLastCalibrationDate ON dbo.tblTicket.ID = dbo.quniLastCalibrationDate.TicketID LEFT OUTER JOIN
                dbo.tlkpTicketType ON dbo.tblTicket.TicketTypeID = dbo.tlkpTicketType.ID LEFT OUTER JOIN
                dbo.tblSite ON dbo.tblTicket.SiteID = dbo.tblSite.ID LEFT OUTER JOIN
                dbo.tlkpTicketStatus ON dbo.tblTicket.TicketStatusID = dbo.tlkpTicketStatus.ID LEFT OUTER JOIN
                dbo.tlkpCellLeaders ON dbo.tblTicket.CellLeaderID = dbo.tlkpCellLeaders.ID LEFT OUTER JOIN
                dbo.qryMachineGroups ON dbo.tblTicket.MachineGroupID = dbo.qryMachineGroups.ID LEFT OUTER JOIN
                dbo.tlkpDepartment ON dbo.tblTicket.DepartmentID = dbo.tlkpDepartment.ID
WHERE        (dbo.tblTicket.TicketStatusID IN (1, 2, 3))
    GO

IF NOT EXISTS (SELECT * FROM sys.fn_listextendedproperty(N'MS_DiagramPane1' , N'SCHEMA',N'dbo', N'VIEW',N'qryActiveAndReturnedTickets', NULL,NULL))
	EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties =
   Begin PaneConfigurations =
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[25] 4[59] 3[3] 2) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane =
      Begin Origin =
         Top = 0
         Left = 0
      End
      Begin Tables =
         Begin Table = "tblTicket"
            Begin Extent =
               Top = 6
               Left = 38
               Bottom = 136
               Right = 270
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "quniLastCalibrationDate"
            Begin Extent =
               Top = 138
               Left = 38
               Bottom = 268
               Right = 230
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpTicketType"
            Begin Extent =
               Top = 138
               Left = 268
               Bottom = 234
               Right = 438
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tblSite"
            Begin Extent =
               Top = 234
               Left = 268
               Bottom = 330
               Right = 438
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpTicketStatus"
            Begin Extent =
               Top = 270
               Left = 38
               Bottom = 366
               Right = 208
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpCellLeaders"
            Begin Extent =
               Top = 106
               Left = 708
               Bottom = 426
               Right = 913
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "qryMachineGroups"
            Begin Extent =
               Top = 366
               Left = 38
               Bottom = 496
               Right = 23' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'qryActiveAndReturnedTickets'
ELSE
BEGIN
EXEC sys.sp_updateextendedproperty @name=N'MS_DiagramPane1', @value=N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties =
   Begin PaneConfigurations =
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[25] 4[59] 3[3] 2) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane =
      Begin Origin =
         Top = 0
         Left = 0
      End
      Begin Tables =
         Begin Table = "tblTicket"
            Begin Extent =
               Top = 6
               Left = 38
               Bottom = 136
               Right = 270
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "quniLastCalibrationDate"
            Begin Extent =
               Top = 138
               Left = 38
               Bottom = 268
               Right = 230
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpTicketType"
            Begin Extent =
               Top = 138
               Left = 268
               Bottom = 234
               Right = 438
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tblSite"
            Begin Extent =
               Top = 234
               Left = 268
               Bottom = 330
               Right = 438
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpTicketStatus"
            Begin Extent =
               Top = 270
               Left = 38
               Bottom = 366
               Right = 208
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpCellLeaders"
            Begin Extent =
               Top = 106
               Left = 708
               Bottom = 426
               Right = 913
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "qryMachineGroups"
            Begin Extent =
               Top = 366
               Left = 38
               Bottom = 496
               Right = 23' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'qryActiveAndReturnedTickets'
END
GO

IF NOT EXISTS (SELECT * FROM sys.fn_listextendedproperty(N'MS_DiagramPane2' , N'SCHEMA',N'dbo', N'VIEW',N'qryActiveAndReturnedTickets', NULL,NULL))
	EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPane2', @value=N'8
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpDepartment"
            Begin Extent =
               Top = 498
               Left = 38
               Bottom = 628
               Right = 269
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane =
   End
   Begin DataPane =
      Begin ParameterDefaults = ""
      End
   End
   Begin CriteriaPane =
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'qryActiveAndReturnedTickets'
ELSE
BEGIN
EXEC sys.sp_updateextendedproperty @name=N'MS_DiagramPane2', @value=N'8
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "tlkpDepartment"
            Begin Extent =
               Top = 498
               Left = 38
               Bottom = 628
               Right = 269
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane =
   End
   Begin DataPane =
      Begin ParameterDefaults = ""
      End
   End
   Begin CriteriaPane =
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'qryActiveAndReturnedTickets'
END
GO

IF NOT EXISTS (SELECT * FROM sys.fn_listextendedproperty(N'MS_DiagramPaneCount' , N'SCHEMA',N'dbo', N'VIEW',N'qryActiveAndReturnedTickets', NULL,NULL))
	EXEC sys.sp_addextendedproperty @name=N'MS_DiagramPaneCount', @value=2 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'qryActiveAndReturnedTickets'
ELSE
BEGIN
EXEC sys.sp_updateextendedproperty @name=N'MS_DiagramPaneCount', @value=2 , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'VIEW',@level1name=N'qryActiveAndReturnedTickets'
END
GO


