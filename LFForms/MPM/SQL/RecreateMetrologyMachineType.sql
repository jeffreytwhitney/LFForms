USE [LF_RMS_COMMS_MPM]
GO
/****** Object:  Table [dbo].[tblMetrologyMachineType]    Script Date: 11/11/2026 11:49:24 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tblMetrologyMachineType]') AND type in (N'U'))
DROP TABLE [dbo].[tblMetrologyMachineType]
    GO
/****** Object:  Table [dbo].[tblMetrologyMachineType]    Script Date: 11/11/2026 11:49:24 AM ******/
    SET ANSI_NULLS ON
    GO
    SET QUOTED_IDENTIFIER ON
    GO
CREATE TABLE [dbo].[tblMetrologyMachineType](
    [ID] [int] IDENTITY(1,1) NOT NULL,
    [MetrologyMachineType] [varchar](50) NOT NULL,
    [ServiceTypeID] [int] NULL,
    [MaintenanceIntervalMonths] [int] NULL,
    CONSTRAINT [PK_tblMetrologyMachineType] PRIMARY KEY CLUSTERED
(
[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
    GO
    SET IDENTITY_INSERT [dbo].[tblMetrologyMachineType] ON
    GO
    INSERT [dbo].[tblMetrologyMachineType] ([ID], [MetrologyMachineType], [ServiceTypeID], [MaintenanceIntervalMonths]) VALUES (1, N'Hexagon CMM', 1, 3)
    GO
    INSERT [dbo].[tblMetrologyMachineType] ([ID], [MetrologyMachineType], [ServiceTypeID], [MaintenanceIntervalMonths]) VALUES (2, N'Zeiss CMM', 1, 3)
    GO
    INSERT [dbo].[tblMetrologyMachineType] ([ID], [MetrologyMachineType], [ServiceTypeID], [MaintenanceIntervalMonths]) VALUES (3, N'Contracer', 8, 3)
    GO
    INSERT [dbo].[tblMetrologyMachineType] ([ID], [MetrologyMachineType], [ServiceTypeID], [MaintenanceIntervalMonths]) VALUES (4, N'Profilometer', 7, 3)
    GO
    INSERT [dbo].[tblMetrologyMachineType] ([ID], [MetrologyMachineType], [ServiceTypeID], [MaintenanceIntervalMonths]) VALUES (5, N'MicroVu', NULL, 3)
    GO
    INSERT [dbo].[tblMetrologyMachineType] ([ID], [MetrologyMachineType], [ServiceTypeID], [MaintenanceIntervalMonths]) VALUES (6, N'Keyence', NULL, 3)
    GO
    SET IDENTITY_INSERT [dbo].[tblMetrologyMachineType] OFF
    GO
